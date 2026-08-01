# 18. Lab: idempotent order processing

## Goal

Implement/verify an idempotent `process_order`; simulate duplicate delivery and worker restart.

---

## Step 1. Happy path

```bash
curl -s -X POST http://localhost:8093/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_id":"idem-100","amount":"99.00"}'

sleep 2
curl -s http://localhost:8093/orders/idem-100/
# status completed
```

---

## Step 2. Duplicate enqueue

```bash
# same order_id twice quickly
curl -s -X POST ... -d '{"order_id":"idem-100","amount":"99.00"}'
curl -s -X POST ... -d '{"order_id":"idem-100","amount":"99.00"}'
```

Worker: second execution logs **already_processed**. `GET /orders/idem-100/` — still one completion.

---

## Step 3. Upgrade to Redis dedup (optional)

Replace in-memory set:

```python
import redis
from shop.config import settings

r = redis.from_url(settings.redis_url)

def mark_processed(order_id: str) -> bool:
    return r.set(f"processed:{order_id}", "1", nx=True, ex=86400)
```

In task: if not `mark_processed(order_id): return skip`.

---

## Step 4. Postgres unique (stretch)

Integrate [`deploy/fastapi`](../../deploy/fastapi/README.md) postgres — table `processed_orders(order_id PK)`.

---

## Step 5. Document in README

Comment in the code **why** idempotency matters — an interview story.

---

## Success criteria

- [ ] Duplicate order_id doesn't double-charge (simulated)
- [ ] API GET order consistent
- [ ] Logs show idempotent skip
- [ ] (Optional) Redis NX dedup survives worker restart

Next: [19-workflows-canvas](19-workflows-canvas.md).
