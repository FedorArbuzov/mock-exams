# 10. Lab: stop a replica

## Ticket

P1 — drill

SRE wants a game day: `clickhouse-server` on `ch-03` down, INSERT still works, replica catches up after start.

Stop **Server** on `ch-03` only. Do **not** stop Keeper on two nodes. Do **not** stop Server on two nodes.

## Task 1. Record

```sql
SELECT replica_name, is_readonly, active_replicas, queue_size
FROM system.replicas WHERE table = 'events';

SET insert_quorum = 2;
INSERT INTO shop.events VALUES (now(), 10, 'before-down');
```

## Task 2. Stop Server on ch-03

```bash
ansible ch-03 -b -m service -a "name=clickhouse-server state=stopped"
ansible ch-03 -b -m command -a "systemctl is-active clickhouse-keeper"
```

Keeper on `ch-03` stays **active**. Quorum is still 3.

From `ch-01` or `ch-02`:

```sql
SELECT replica_name, active_replicas FROM system.replicas WHERE table = 'events';
SET insert_quorum = 2;
INSERT INTO shop.events VALUES (now(), 11, 'during-down');
```

Insert must succeed. `active_replicas` should be 2.

## Task 3. Start and wait

```bash
ansible ch-03 -b -m service -a "name=clickhouse-server state=started"
```

On `ch-03`:

```sql
SELECT count() FROM shop.events;
SELECT is_readonly, queue_size, absolute_delay FROM system.replicas WHERE table = 'events';
```

Wait until `is_readonly = 0` and the during-down row is visible. `SYSTEM SYNC REPLICA shop.events` if you want a blocking wait. Do not “fix” by dropping the table.

## Success criteria

- [ ] INSERT with `insert_quorum=2` succeeded while `ch-03` Server was down
- [ ] Keeper on `ch-03` was never stopped
- [ ] after start, `ch-03` has the new rows and is not readonly
- [ ] you did not wipe `/var/lib/clickhouse`

Next: [11. Change windows](11-change-window.md).
