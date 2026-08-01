# 16. Lab: retry welcome email

## Goal

Run `send_welcome_email` many times, observe retries in Flower/logs, and SUCCESS after random failures.

---

## Step 1. Trigger batch

```bash
for i in $(seq 1 10); do
  curl -s -X POST http://localhost:8093/tasks/welcome-email/ \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":\"u$i\",\"email\":\"u$i@test.local\"}"
done
```

---

## Step 2. Worker logs

```bash
docker compose logs worker -f | grep -E 'welcome|retry|Retry'
```

~15% random failure triggers `self.retry(countdown=2**retries)`.

---

## Step 3. Flower

Tasks tab — filter `shop.tasks.send_welcome_email` — see RETRY states.

---

## Step 4. Tune failure rate (dev)

Change `random.random() < 0.15` to `0.5` for more retries — rebuild worker.

---

## Step 5. max_retries test

Set `max_retries=1`, flood tasks — some end FAILURE after 1 retry.

---

## Success criteria

- [ ] RETRY visible in logs/Flower
- [ ] Most tasks eventually SUCCESS
- [ ] FAILURE after max_retries is exhausted (optional tuning)

Next: [17-idempotency](17-idempotency.md).
