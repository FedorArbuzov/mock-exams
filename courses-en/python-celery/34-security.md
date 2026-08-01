# 34. Security: signing, broker ACL

## Intro

An open broker = anyone can publish arbitrary tasks → **RCE** with pickle (don't) or resource exhaustion.

## What you'll learn

- Message signing.
- Broker credentials, vhost, TLS.
- Task allowlist.

---

## JSON + accept_content

```python
app.conf.accept_content = ["json"]
app.conf.task_serializer = "json"
```

Reject pickle messages — prevents deserialization attacks.

---

## Broker auth

```python
broker_url = "amqp://user:strongpass@rabbitmq:5672/production"
```

- Unique user per app
- Least privilege vhost
- TLS: `amqps://` in production

[`rabbitmq-basic`](../rabbitmq-basic/README.md) — users and vhosts.

---

## Redis backend auth

```python
result_backend = "redis://:password@redis:6379/0"
```

[`redis-basic/ACL`](../redis-basic/README.md) — ACL users.

---

## Task signing (optional)

```python
app.conf.security_key = os.environ["CELERY_SECURITY_KEY"]
app.conf.task_serializer = "auth"  # legacy signed pickle — prefer json + network trust
```

Modern approach: **private network** + mTLS between services, not public broker.

---

## Flower / API exposure

- Flower behind auth + VPN
- API doesn't expose `send_task` arbitrary name endpoint

---

## Secrets in tasks

Don't pass passwords in task args — logs + Redis retain them. Pass **token id**, worker fetches from Vault — [`secrets-basic`](../secrets-basic/README.md).

---

## Resource limits

```python
@shared_task(soft_time_limit=60, time_limit=90)
def bounded():
    ...
```

Prevent runaway tasks.

---

## Common mistakes

| Error | Risk |
|-------|------|
| Broker on public 0.0.0.0 | enqueue spam |
| pickle serializer | RCE |
| SECRET in task kwargs | leak in Flower |

## Summary

JSON only. Private broker with auth/TLS. No secrets in messages. Protect Flower. Network segmentation.

Next: [35-interview-qa](35-interview-qa.md).
