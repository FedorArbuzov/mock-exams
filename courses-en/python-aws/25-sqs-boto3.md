# 25. SQS boto3: send, receive, delete, visibility

## Intro: "the message was processed twice"

A worker received a message and crashed **after** the business logic but **before** `delete_message` — the visibility timeout expired, the message became visible again → duplicate processing. SQS is an **at-least-once** queue, not exactly-once. The correct pattern: **process → delete** (or extend visibility) + an **idempotent** handler.

Reference: [`SQSService`](../../deploy/python-aws/stack/shop_aws/sqs_service.py), queue `shop-events`.

## What you'll learn

- Queue URL vs Queue Name.
- `send_message`, `receive_message`, `delete_message`.
- Visibility timeout and long polling.
- Standard vs FIFO (overview).

---

## Queue lifecycle in the stack

```python
class SQSService:
    @property
    def queue_url(self) -> str:
        try:
            return self._sqs.get_queue_url(QueueName=self.queue_name)["QueueUrl"]
        except QueueDoesNotExist:
            return self._sqs.create_queue(QueueName=self.queue_name)["QueueUrl"]
```

Bootstrap ([`bootstrap_localstack.py`](../../deploy/python-aws/stack/scripts/bootstrap_localstack.py)) touches `queue_url` → the queue exists.

| Setting | Lab default |
|---------|-------------|
| Queue name | `shop-events` (env `SHOP_QUEUE`) |
| Type | Standard |
| DLQ | not in the minimal stack (add in prod) |

---

## send_message

```python
def send(self, payload: dict) -> str:
    resp = self._sqs.send_message(
        QueueUrl=self.queue_url,
        MessageBody=json.dumps(payload),
    )
    return resp["MessageId"]
```

| Parameter | Use |
|-----------|-----|
| `MessageBody` | string ≤ 256 KB |
| `DelaySeconds` | 0–900 postpone delivery |
| `MessageAttributes` | typed metadata filters |
| `MessageGroupId` | FIFO only |

---

## receive_message

```python
resp = self._sqs.receive_message(
    QueueUrl=self.queue_url,
    MaxNumberOfMessages=10,  # 1–10
    WaitTimeSeconds=20,       # long polling 0–20
    VisibilityTimeout=30,
)
messages = resp.get("Messages", [])
```

| Parameter | Effect |
|-----------|--------|
| `WaitTimeSeconds` | long poll — fewer empty receives |
| `VisibilityTimeout` | hide the message from other consumers |
| `MaxNumberOfMessages` | batch efficiency |

After a receive, the message is **invisible** to other consumers for the visibility duration.

---

## delete_message

```python
self._sqs.delete_message(
    QueueUrl=self.queue_url,
    ReceiptHandle=msg["ReceiptHandle"],
)
```

You **must** delete after successful processing. `ReceiptHandle` is unique per receive — invalid after delete or expiry.

The stack's `receive_one` — receive + delete in one method (lab convenience).

---

## Visibility timeout flow

```text
T0: Worker A receives msg → invisible 30s
T5: A still processing...
T30: timeout → msg visible again
T31: Worker B receives → DUPLICATE unless idempotent
```

Fixes:

| Fix | When |
|-----|------|
| Increase `VisibilityTimeout` | job duration known |
| `ChangeMessageVisibility` | heartbeat during a long job |
| Idempotency key in DDB | always |

---

## Long polling vs short

| `WaitTimeSeconds=0` | `WaitTimeSeconds=20` |
|---------------------|----------------------|
| immediate empty return | blocks up to 20s if no msg |
| higher API call rate | cheaper, lower latency to first msg |

Production workers: **long poll 20s**.

---

## S3 → SQS pattern

An S3 notification with an SQS destination — the worker polls ([11-s3-events-notifications](11-s3-events-notifications.md)). The message body = the full S3 event JSON.

Contrast with Celery: [python-celery/01-task-queues-landscape](../python-celery/01-task-queues-landscape.md).

---

## FIFO vs Standard

| | Standard | FIFO |
|--|----------|------|
| Order | best-effort | strict per group |
| Throughput | unlimited | 300 TPS (more with batching) |
| Name | any | must end with `.fifo` |
| Dedup | no | optional content-based |

Shop events lab — **Standard**.

---

## Error handling

| Error | Cause |
|-------|-------|
| `ReceiptHandleIsInvalid` | already deleted or expired |
| `QueueDoesNotExist` | wrong URL / not created |
| Poison message | fails forever → configure DLQ + maxReceiveCount |

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Forget to delete | infinite reprocessing |
| Visibility too short | duplicates |
| Parse body once, never delete | leak nothing but cost |
| Assume exactly-once | double charges |

## Summary

SQS: **send → receive (invisible) → process → delete**. Long polling lowers cost. Duplicates are the norm; idempotency is mandatory. `SQSService` — a lab wrapper for `shop-events`.

Next: [26-lab-sqs-worker](26-lab-sqs-worker.md).
