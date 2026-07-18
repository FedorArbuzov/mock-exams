# 16. Лаба: retry welcome email

## Цель

Запустить `send_welcome_email` многократно, наблюдать retries в Flower/logs, SUCCESS после random failures.

---

## Шаг 1. Trigger batch

```bash
for i in $(seq 1 10); do
  curl -s -X POST http://localhost:8093/tasks/welcome-email/ \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":\"u$i\",\"email\":\"u$i@test.local\"}"
done
```

---

## Шаг 2. Worker logs

```bash
docker compose logs worker -f | grep -E 'welcome|retry|Retry'
```

~15% random failure triggers `self.retry(countdown=2**retries)`.

---

## Шаг 3. Flower

Tasks tab — filter `shop.tasks.send_welcome_email` — see RETRY states.

---

## Шаг 4. Tune failure rate (dev)

Change `random.random() < 0.15` to `0.5` for more retries — rebuild worker.

---

## Шаг 5. max_retries test

Set `max_retries=1`, flood tasks — some end FAILURE after 1 retry.

---

## Критерии приёмки

- [ ] Видны RETRY в logs/Flower
- [ ] Большинство tasks eventual SUCCESS
- [ ] FAILURE после исчерпания max_retries (optional tuning)

Далее: [17-idempotency](17-idempotency.md).
