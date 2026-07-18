# 11. Transactions and MVCC

Support says catalog prices keep jumping. Turns out — two UPDATEs in a migration script with no transaction, plus a stale app cache. Another ticket: disk keeps growing, autovacuum can't keep up — someone left `BEGIN; SELECT ...` open and went to lunch (**idle in transaction**, 4 hours). Third case: numbers in a report don't match — developer expected one snapshot for the whole transaction, but Postgres default is Read Committed.

PostgreSQL uses **MVCC** (Multi-Version Concurrency Control): readers don't block writers. But dead row versions and long-running transactions are still your problem. This chapter explains the mechanics in plain language and when to pick which isolation level.

## Transactions — all or nothing

Think of a bank transfer: debit account A, credit account B. If the server crashes after the debit — money vanished. A transaction guarantees: **both operations happen, or neither does**.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

Something goes wrong between the two UPDATEs:

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  -- constraint violation, division by zero, whatever
ROLLBACK;  -- rolls back EVERYTHING, as if BEGIN never happened
```

**Without explicit `BEGIN`**, each SQL statement is its own autocommit transaction. Two UPDATEs in a row without `BEGIN` = **two separate** transactions. Another client can see the intermediate state in between.

| Command | What it does |
|---------|--------------|
| `BEGIN` | start a transaction |
| `COMMIT` | save all changes |
| `ROLLBACK` | undo everything since `BEGIN` |
| `SAVEPOINT name` | rollback point inside a transaction |
| `ROLLBACK TO name` | roll back to savepoint, transaction continues |

In FastAPI/Django the ORM often opens transactions for you — but **you** define the boundaries. One HTTP request = one transaction is a solid OLTP habit.

## ACID — four promises

| Property | Plain English | How Postgres does it |
|----------|---------------|----------------------|
| **Atomicity** | all or nothing | WAL: uncommitted changes can be rolled back |
| **Consistency** | data follows the rules | PK, FK, CHECK, UNIQUE checked at commit |
| **Isolation** | concurrent transactions don't step on each other | MVCC + isolation level |
| **Durability** | after COMMIT, data survives a crash | commit waits for WAL on disk |

```sql
BEGIN;
UPDATE shop.products SET price = price + 1 WHERE id = 1;
-- error → ROLLBACK undoes everything
COMMIT;
```

**`synchronous_commit`:** by default Postgres won't say COMMIT OK until WAL hits disk. You can relax it (`synchronous_commit = off`) for speed — but you risk losing the last few seconds of data in a crash. On prod, leave the default.

## MVCC — why SELECT doesn't block UPDATE

Classic problem: one client reads a report for 5 minutes, another can't update those rows — everything freezes. Postgres handles this differently: it **doesn't block readers**, it keeps **multiple versions** of each row.

Every row version in the heap has:

- **xmin** — transaction ID that **created** this version
- **xmax** — transaction ID that **deleted/replaced** it (0 = still alive)

| Operation | What actually happens |
|-----------|----------------------|
| `INSERT` | new row, xmin = current transaction |
| `UPDATE` | old version marked dead; **new** row with new xmin |
| `DELETE` | version marked dead; disk space **not freed yet** |
| `SELECT` | sees only versions **visible** in this transaction's snapshot |

**UPDATE doesn't overwrite the row in place.** It's a new version + a dead old one. That's why:

- A table **grows** even if you "only UPDATE" — never INSERT
- Without VACUUM, dead tuples pile up
- Seq Scan reads live and dead versions — slower

### Try it: two psql sessions

Open **two terminals** (you'll do this again in [12-lab-mvcc](12-lab-mvcc.md)):

**Session A:**

```sql
BEGIN;
UPDATE shop.products SET price = 999 WHERE id = 1;
-- do NOT COMMIT yet
```

**Session B:**

```sql
SELECT price FROM shop.products WHERE id = 1;
-- still the OLD price — B can't see A's uncommitted change
```

**Session A:** `COMMIT;`

**Session B:** `SELECT price ...` — now 999.

Until A commits, B sees the **previous** version. That's snapshot isolation.

## Isolation levels — what your transaction sees

A snapshot is a "photo" of the database at a point in time. The isolation level decides **when** you get a new photo.

```sql
SHOW transaction_isolation;  -- read committed (default)
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

| Level | New snapshot | Typical use |
|-------|--------------|-------------|
| **Read committed** (default) | every SQL statement | 99% of OLTP — FastAPI, Django, CRUD |
| **Repeatable read** | once per transaction | reports where numbers must stay consistent |
| **Serializable** | strictest | financial invariants, no races allowed |

### Read Committed — default, and that's fine

```sql
-- Session A
BEGIN;
SELECT count(*) FROM shop.orders WHERE status = 'pending';  -- 100

-- Session B
INSERT INTO shop.orders (..., status) VALUES (..., 'pending');
COMMIT;

-- Session A, same transaction
SELECT count(*) FROM shop.orders WHERE status = 'pending';  -- 101 (!)
COMMIT;
```

A new row appeared between two SELECTs in the same transaction. **Not a bug** — that's Read Committed. Each statement sees committed changes from others.

**When this bites you:** you COUNT, decide, then INSERT — but someone inserted between your count and insert. Fix: `SELECT ... FOR UPDATE` or Serializable.

### Repeatable Read — frozen picture

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM shop.orders WHERE status = 'pending';  -- 100
-- B inserts and commits...
SELECT count(*) FROM shop.orders WHERE status = 'pending';  -- still 100
COMMIT;
```

Same snapshot for the whole transaction. Good for multi-query reports. **Don't hold it for hours** — it blocks VACUUM.

### Serializable — when you can't afford to be wrong

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- complex SELECT + INSERT logic
COMMIT;
-- or: ERROR: could not serialize access due to concurrent update
```

Postgres may **reject** the transaction. Your app must **retry**. More CPU, but the result is as if transactions ran one after another.

**Use case:** last item on the shelf — two customers buying at once. Read Committed can let both "succeed." Serializable won't.

## VACUUM — cleaning up dead versions

DELETE and UPDATE leave **dead tuples** — old versions nobody can see anymore. They sit on disk until **VACUUM** removes them.

```sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';
```

| Metric | Meaning |
|--------|---------|
| `n_live_tup` | live rows |
| `n_dead_tup` | dead versions waiting for vacuum |
| `last_autovacuum` | last autovacuum run |

**Autovacuum** runs in the background ([01-architecture](01-architecture.md)). You usually don't call `VACUUM` manually — but you must **not get in its way**.

| Problem | What happens |
|---------|--------------|
| Lots of dead tuples | Seq Scan reads garbage, queries slow, disk grows |
| Long transaction holds old snapshot | VACUUM **can't** remove versions that transaction might still see |
| Xid wraparound | emergency mode — freeze can't keep up |

```sql
VACUUM shop.products;        -- routine cleanup
VACUUM FULL shop.products;   -- rewrites whole table, EXCLUSIVE LOCK — maintenance window only
```

More: [intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md).

## Locks — MVCC doesn't cover everything

MVCC fixes reader-vs-writer for normal SELECT. When you need to **guarantee** data won't change before you commit — use explicit locks.

```sql
BEGIN;
SELECT * FROM shop.products WHERE id = 1 FOR UPDATE;
UPDATE shop.products SET stock = stock - 1 WHERE id = 1;
COMMIT;
```

Pattern: read stock → check → decrement. Without `FOR UPDATE`, two clients can both read `stock = 1` and both sell — oversell.

DDL locks are heavier:

| Operation | Lock | Blocks |
|-----------|------|--------|
| `CREATE INDEX` | ShareLock | writes |
| `CREATE INDEX CONCURRENTLY` | weaker | longer, but doesn't block INSERT |
| `ALTER TABLE` | AccessExclusiveLock | everything including SELECT |
| `VACUUM FULL` | AccessExclusiveLock | everything |

Who's waiting:

```sql
SELECT a.pid, a.usename, a.state, l.mode, l.granted, left(a.query, 60)
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted;
```

`granted = false` means someone is blocked. Check `query` — often an idle-in-transaction session holds a lock while a migration waits.

## idle in transaction — the quiet production killer

In `pg_stat_activity`: **`idle in transaction`** — client ran `BEGIN`, maybe one query, then went silent. Connection open, transaction never finished.

```sql
SELECT pid, state, xact_start, left(query, 80)
FROM pg_stat_activity
WHERE state = 'idle in transaction';
```

**Why it hurts:**

1. Holds a snapshot → VACUUM can't clean dead tuples → bloat, disk growth
2. Holds row locks after `FOR UPDATE` → others wait
3. Eats connection pool slots — 100 sleeping sessions = 100 of `max_connections` gone
4. Holds xmin → xid wraparound risk

**Where it comes from:**

- Developer opens psql, runs `BEGIN`, walks away
- ORM opens a transaction for the whole HTTP request, calls an external API for 30 seconds inside it
- Metabase/DBeaver keeps a transaction open between preview and export

**Defense:**

```sql
idle_in_transaction_session_timeout = '5min'  -- in postgresql.conf
```

In apps: short transactions, no HTTP/RabbitMQ **inside** a DB transaction, `pool_pre_ping` in SQLAlchemy.

## Things people usually get wrong

1. **100k UPDATEs in one transaction** — WAL bloat, table bloat, locks. Batch with COMMITs.
2. **ORM transaction spans external API call** — idle in transaction + pool exhaustion.
3. **Expecting Repeatable Read by default** — Postgres default is Read Committed. Second SELECT can return different data.
4. **`VACUUM FULL` during peak** — exclusive lock, downtime.
5. **Two UPDATEs without BEGIN** in a script — intermediate state visible to others.
6. **No retry on Serializable** — app crashes on serialization error instead of retrying.

## Before you move on

- [ ] I can explain BEGIN/COMMIT with the money transfer example
- [ ] UPDATE creates a new row version; old one is a dead tuple
- [ ] Read Committed: new snapshot per statement
- [ ] Repeatable Read: one snapshot for the whole transaction
- [ ] VACUUM cleans dead tuples, not DELETE
- [ ] idle in transaction blocks vacuum and holds locks
- [ ] I know where to look: `n_dead_tup`, `pg_stat_activity`

## What's next

Two psql sessions, MVCC with your own eyes: [12-lab-mvcc.md](12-lab-mvcc.md).
