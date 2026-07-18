# 26. Лаба: poll очереди shop-events

## Сценарий

Order service публикует события `order.created` в SQS. Background worker в Python poll `shop-events`, логирует payload, опционально пишет audit в DynamoDB.

**Цель:** send batch messages, poll loop с long polling, корректный delete после обработки.

---

## Предусловия

```bash
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Шаг 1. Send test events

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.sqs_service import SQSService
sqs = SQSService()
for i in range(5):
    mid = sqs.send({'event': 'order.created', 'order_id': f'ord-{i}', 'amount': 10 + i})
    print(mid)
"
```

---

## Шаг 2. Single receive via SQSService

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.sqs_service import SQSService
msg = SQSService().receive_one(wait_seconds=5)
print(msg)
"
```

Повторите — следующее сообщение. После 5 iter queue пуста → `None`.

---

## Шаг 3. Worker loop (explicit API)

```python
#!/usr/bin/env python3
"""Poll shop-events with long polling — no auto-delete wrapper."""
import json
import signal
import sys

from shop_aws.clients import client
from shop_aws.config import settings
from shop_aws.dynamodb_repo import DynamoDBRepository

running = True


def stop(*_):
    global running
    running = False


signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGTERM, stop)


def main():
    sqs = client("sqs")
    url = sqs.get_queue_url(QueueName=settings.shop_queue)["QueueUrl"]
    repo = DynamoDBRepository()

    while running:
        resp = sqs.receive_message(
            QueueUrl=url,
            MaxNumberOfMessages=5,
            WaitTimeSeconds=10,
            VisibilityTimeout=60,
        )
        for msg in resp.get("Messages", []):
            body = json.loads(msg["Body"])
            order_id = body.get("order_id", "unknown")
            print(f"processing {order_id}")
            repo.put_item(
                pk=f"audit:{order_id}",
                data={"event": body.get("event"), "status": "processed"},
            )
            sqs.delete_message(QueueUrl=url, ReceiptHandle=msg["ReceiptHandle"])
            print(f"done {order_id}")


if __name__ == "__main__":
    main()
```

Запуск (краткий тест — прервите Ctrl+C):

```bash
# terminal 1: seed again if queue empty
docker exec mock-python-aws-lab python -c "
from shop_aws.sqs_service import SQSService
SQSService().send({'event': 'order.created', 'order_id': 'ord-worker-1'})
"

# terminal 2
docker exec mock-python-aws-lab python sqs_worker.py
```

---

## Шаг 4. Verify audit rows

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.dynamodb_repo import DynamoDBRepository
item = DynamoDBRepository().get_item('audit:ord-worker-1')
print(item)
"
```

---

## Шаг 5. Visibility demo (optional)

1. Receive **без** delete (raw receive_message).
2. Подождите > VisibilityTimeout.
3. Second worker receive — same body again.

Урок: без idempotency `audit:{order_id}` overwrite ok; payment — not ok.

---

## Шаг 6. Purge queue (cleanup)

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
from shop_aws.config import settings
sqs = client('sqs')
url = sqs.get_queue_url(QueueName=settings.shop_queue)['QueueUrl']
sqs.purge_queue(QueueUrl=url)
print('purged')
"
```

Purge — once per 60s limit in AWS.

---

## Критерии приёмки

- [ ] 5 messages sent with unique order_id
- [ ] Worker long poll `WaitTimeSeconds=10`
- [ ] delete_message после успешного process
- [ ] Audit row в DynamoDB
- [ ] Понимаете почему `receive_one` удаляет сразу

## Резюме

Worker pattern: **poll → parse → side effect → delete**. Explicit loop лучше учит visibility, чем только `receive_one`. SNS fan-out — следующий модуль.

Далее: [27-sns-boto3](27-sns-boto3.md).
