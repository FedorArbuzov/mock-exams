# 14. Lab: ack scenarios

## Goal

Test **retry**, **reject**, and **duplicate delivery** on `process_order`.

---

## Step 1. Transient retry

```bash
curl -s -X POST http://localhost:8093/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_id":"retry-1","amount":"retry"}'
```

Worker logs — retries with countdown. Eventually SUCCESS (if random path) or max retries FAILURE.

---

## Step 2. Permanent reject

```bash
curl -s -X POST http://localhost:8093/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_id":"fail-1","amount":"fail"}'
```

State **FAILURE**, `Reject` in logs — no infinite requeue.

---

## Step 3. Duplicate POST same order_id

```bash
curl -s -X POST ... -d '{"order_id":"dup-1","amount":"10.00"}'
curl -s -X POST ... -d '{"order_id":"dup-1","amount":"10.00"}'
```

Second run — log `Duplicate order_id — idempotent skip`. Only one side effect.

---

## Step 4. Kill worker mid-task

```bash
curl -s -X POST ... -d '{"order_id":"kill-1","amount":"49.99"}'
docker compose kill -s SIGKILL worker
docker compose start worker
```

With acks_late — task **may run twice** — idempotency saves you.

---

## Step 5. Prefetch experiment

Temporarily set `worker_prefetch_multiplier=4`, enqueue 8 long reports, watch one worker hoard — then revert to 1.

---

## Success criteria

- [ ] `amount=fail` → FAILURE
- [ ] `amount=retry` → retries visible
- [ ] duplicate order_id idempotent
- [ ] you understand redelivery after killing the worker

Next: [15-retries-backoff](15-retries-backoff.md).
