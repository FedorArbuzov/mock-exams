# 26. Lab: trigger from API end-to-end

## Goal

The full flow: **POST order → task_id → poll → GET order status**; simulate a broker outage.

---

## Step 1. Happy path script

```bash
BASE=http://localhost:8093

RESP=$(curl -sf -X POST $BASE/orders/ -H "Content-Type: application/json" \
  -d '{"order_id":"api-e2e-1","amount":"25.00"}')
echo $RESP | python -m json.tool

TASK_ID=$(echo $RESP | python -c "import sys,json; print(json.load(sys.stdin)['task_id'])")

for i in $(seq 1 30); do
  STATE=$(curl -sf $BASE/tasks/$TASK_ID/ | python -c "import sys,json; print(json.load(sys.stdin)['state'])")
  echo "state=$STATE"
  [ "$STATE" = "SUCCESS" ] && break
  sleep 0.5
done

curl -sf $BASE/orders/api-e2e-1/ | python -m json.tool
```

---

## Step 2. Welcome email flow

```bash
curl -s -X POST $BASE/tasks/welcome-email/ \
  -H "Content-Type: application/json" \
  -d '{"user_id":"u42","email":"u42@shop.local"}'
```

---

## Step 3. Broker down

```bash
docker compose stop rabbitmq
curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE/tasks/ping/
# expect 500 or connection error from API
docker compose start rabbitmq
sleep 15
curl -s -X POST $BASE/tasks/ping/
```

Optional: wrap `.delay()` in try/except → 503 JSON.

---

## Step 4. OpenAPI docs

[http://localhost:8093/docs](http://localhost:8093/docs) — try endpoints interactively.

---

## Step 5. Latency measure

Time from POST to SUCCESS — expect roughly 1–2s for `process_order` (1s sleep in the task).

---

## Success criteria

- [ ] Script completes SUCCESS + order JSON
- [ ] task_id returned immediately (< 100ms)
- [ ] Broker down handled gracefully (optional 503)

Next: [27-flower-monitoring](27-flower-monitoring.md).
