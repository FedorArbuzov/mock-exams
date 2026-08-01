# 16. Lab: SLOWLOG and latency diagnostics

## Lab goal

Set the slowlog threshold, **intentionally** run a slow operation, read SLOWLOG and `LATENCY DOCTOR`.

## Prerequisites

`docker compose up -d` in `deploy/redis`.

---

## Task 1. Current settings

```bash
docker exec mock-redis redis-cli CONFIG GET slowlog-log-slower-than
docker exec mock-redis redis-cli CONFIG GET slowlog-max-len
docker exec mock-redis redis-cli SLOWLOG LEN
```

---

## Task 2. Lower the threshold (temporarily)

```bash
docker exec mock-redis redis-cli CONFIG SET slowlog-log-slower-than 1
```

1 microsecond — almost everything will enter the log (lab only).

---

## Task 3. Slow operation

```bash
docker exec mock-redis redis-cli DEBUG SLEEP 0.05
```

If `DEBUG` is forbidden by ACL — alternative:

```bash
docker exec mock-redis redis-cli EVAL "local i=0; while i<500000 do i=i+1 end return i" 0
```

---

## Task 4. Reading SLOWLOG

```bash
docker exec mock-redis redis-cli SLOWLOG GET 5
docker exec mock-redis redis-cli SLOWLOG LEN
```

**What you'll see:** entries with duration (microseconds), command argv.

---

## Task 5. COMMANDSTATS

```bash
docker exec mock-redis redis-cli INFO commandstats | head -15
```

Find commands with high `usec_per_call`.

---

## Task 6. LATENCY DOCTOR

```bash
docker exec mock-redis redis-cli LATENCY DOCTOR
```

Read the recommendations (on an empty DB they may be general advice).

---

## Task 7. Restore the threshold

```bash
docker exec mock-redis redis-cli CONFIG SET slowlog-log-slower-than 10000
docker exec mock-redis redis-cli SLOWLOG RESET
```

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | After load, `SLOWLOG GET` is not empty |
| 2 | You understand the duration and command fields |
| 3 | `INFO commandstats` was read |
| 4 | Threshold restored to 10000 |

Next lesson: [17. Operations](17-operations.md).
