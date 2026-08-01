# 14. Lab: reliable queue with List and BLPOP

## Lab goal

Build a `queue:pending` / `queue:processing` queue with `LMOVE`, process a task with **ACK**, and simulate returning a "lost" task.

## Prerequisites

Single stand: `docker compose up -d`.

---

## Task 1. Clear and enqueue tasks

```bash
docker exec mock-redis redis-cli DEL queue:pending queue:processing queue:done
docker exec mock-redis redis-cli LPUSH queue:pending '{"id":"job-1","action":"email"}'
docker exec mock-redis redis-cli LPUSH queue:pending '{"id":"job-2","action":"resize"}'
docker exec mock-redis redis-cli LLEN queue:pending
```

---

## Task 2. Worker takes a task (LMOVE)

```bash
docker exec mock-redis redis-cli LMOVE queue:pending queue:processing RIGHT LEFT
docker exec mock-redis redis-cli LRANGE queue:processing 0 -1
docker exec mock-redis redis-cli LLEN queue:pending
```

**What you'll see:** one task in `processing`, one left in `pending`.

---

## Task 3. Successful ACK

After "processing", remove from processing and mark done:

```bash
TASK='{"id":"job-1","action":"email"}'
docker exec mock-redis redis-cli LREM queue:processing 1 "$TASK"
docker exec mock-redis redis-cli SADD queue:done job-1
docker exec mock-redis redis-cli SISMEMBER queue:done job-1
```

---

## Task 4. Simulate worker crash

Take the second task, **do not** ACK:

```bash
docker exec mock-redis redis-cli LMOVE queue:pending queue:processing RIGHT LEFT
docker exec mock-redis redis-cli LRANGE queue:processing 0 -1
```

Reaper (manual return):

```bash
docker exec mock-redis redis-cli RPOPLPUSH queue:processing queue:pending
# or: LRANGE + LPUSH + LREM — in prod a script/Lua
docker exec mock-redis redis-cli LLEN queue:pending
```

**What you'll see:** the task is back in `pending`.

---

## Task 5. BLPOP for waiting

Terminal 1:

```bash
docker exec mock-redis redis-cli BLPOP queue:pending 0
```

Terminal 2 (or after Ctrl+C — short timeout):

```bash
docker exec mock-redis redis-cli LPUSH queue:pending '{"id":"job-3"}'
```

**What you'll see:** BLPOP unblocks and returns the element.

---

## Task 6. Idempotency

"Process" `job-1` again:

```bash
docker exec mock-redis redis-cli SADD queue:done job-1
```

`SADD` returns `0` — duplicate not created. In the app check `SISMEMBER` or a DB key.

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | `LMOVE` moves the task atomically |
| 2 | ACK removes from `processing` |
| 3 | Without ACK the reaper returns to `pending` |
| 4 | `BLPOP` blocks until `LPUSH` |
| 5 | `SADD queue:done` prevents a repeat |

Next lesson: [15. Monitoring](15-monitoring.md).
