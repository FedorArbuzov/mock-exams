# Interview cheatsheet — Celery

## Quick map

| Topic | Key phrase |
|-------|------------|
| Model | producer → broker → worker |
| Broker | RabbitMQ (prod), Redis (simple) |
| Backend | Redis stores task results |
| delay | sugar for apply_async |
| acks_late | ack after run → redelivery |
| idempotency | at-least-once safe |
| Beat | one scheduler process |
| chain | sequential tasks |
| group | parallel tasks |
| chord | group + callback |
| Flower | monitoring UI |
| eager | sync test mode |

## Commands

```bash
celery -A shop.celery_app worker --loglevel=info -Q default,orders
celery -A shop.celery_app beat --loglevel=info
celery -A shop.celery_app flower --port=5555
celery -A shop.celery_app inspect registered
celery -A shop.celery_app inspect active
rabbitmqctl list_queues name messages consumers
```

## Stenд

| Port | Service |
|------|---------|
| 8093 | API |
| 5555 | Flower |
| 5673 | AMQP |
| 15673 | RabbitMQ UI |

## Debug PENDING

1. Worker running?
2. `-Q` includes target queue?
3. Task registered?
4. Broker healthy?

Полные ответы: [35-interview-qa](35-interview-qa.md).
