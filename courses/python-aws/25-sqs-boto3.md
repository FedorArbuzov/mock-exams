# 25. SQS boto3: send, receive, delete, visibility

## Введение: «сообщение обработано дважды»

Worker получил message, упал **после** business logic но **до** `delete_message` — visibility timeout истёк, message снова visible → duplicate processing. SQS — **at-least-once** queue, не exactly-once. Правильный паттерн: **process → delete** (или extend visibility) + **idempotent** handler.

Эталон: [`SQSService`](../../deploy/python-aws/stack/shop_aws/sqs_service.py), queue `shop-events`.

## Что вы узнаете

- Queue URL vs Queue Name.
- `send_message`, `receive_message`, `delete_message`.
- Visibility timeout и long polling.
- Standard vs FIFO (overview).

---

## Queue lifecycle в стеке

```python
class SQSService:
    @property
    def queue_url(self) -> str:
        try:
            return self._sqs.get_queue_url(QueueName=self.queue_name)["QueueUrl"]
        except QueueDoesNotExist:
            return self._sqs.create_queue(QueueName=self.queue_name)["QueueUrl"]
```

Bootstrap ([`bootstrap_localstack.py`](../../deploy/python-aws/stack/scripts/bootstrap_localstack.py)) touch `queue_url` → queue exists.

| Setting | Lab default |
|---------|-------------|
| Queue name | `shop-events` (env `SHOP_QUEUE`) |
| Type | Standard |
| DLQ | not in minimal stack (add in prod) |

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
| `WaitTimeSeconds` | long poll — меньше empty receives |
| `VisibilityTimeout` | hide message from other consumers |
| `MaxNumberOfMessages` | batch efficiency |

После receive message **invisible** другим consumers на duration visibility.

---

## delete_message

```python
self._sqs.delete_message(
    QueueUrl=self.queue_url,
    ReceiptHandle=msg["ReceiptHandle"],
)
```

**Must** delete after successful processing. `ReceiptHandle` unique per receive — invalid after delete or expiry.

Стек `receive_one` — receive + delete в одном методе (lab convenience).

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
| `ChangeMessageVisibility` | heartbeat during long job |
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

S3 notification destination SQS — worker poll ([11-s3-events-notifications](11-s3-events-notifications.md)). Message body = full S3 event JSON.

Contrast Celery: [python-celery/01-task-queues-landscape](../python-celery/01-task-queues-landscape.md).

---

## FIFO vs Standard

| | Standard | FIFO |
|--|----------|------|
| Order | best-effort | strict per group |
| Throughput | unlimited | 300 TPS (with batching more) |
| Name | any | must end `.fifo` |
| Dedup | no | optional content-based |

Shop events lab — **Standard**.

---

## Error handling

| Error | Cause |
|-------|-------|
| `ReceiptHandleIsInvalid` | already deleted or expired |
| `QueueDoesNotExist` | wrong URL / not created |
| Poison message | fail forever → configure DLQ + maxReceiveCount |

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Forget delete | infinite reprocessing |
| Visibility too short | duplicates |
| Parse body once, delete never | leak nothing but cost |
| Assume exactly-once | double charges |

## Резюме

SQS: **send → receive (invisible) → process → delete**. Long polling снижает cost. Duplicates — норма; idempotency обязательна. `SQSService` — lab wrapper для `shop-events`.

Далее: [26-lab-sqs-worker](26-lab-sqs-worker.md).
