# 27. SNS boto3: publish, subscribe, fan-out

## Введение: «одно событие — три команды должны узнать»

Order shipped: email service, analytics, warehouse. Point-to-point SQS на каждого — producer шлёт три раза. **SNS topic** — один `publish`, N subscribers (SQS, Lambda, HTTP, email). Fan-out decouples **publisher** от **consumers**.

LocalStack: SNS в [`docker-compose.yml`](../../deploy/python-aws/docker-compose.yml) SERVICES.

## Что вы узнаете

- Topic, subscription, protocol.
- `publish` Message / MessageStructure.
- SNS → SQS fan-out pattern.
- Filter policies (overview).

---

## Core model

```text
Publisher → SNS Topic (shop-notifications)
              ├── subscription → SQS queue A (email-worker)
              ├── subscription → SQS queue B (analytics)
              └── subscription → Lambda (audit)
```

| Entity | Responsibility |
|--------|----------------|
| Topic | named event bus |
| Subscription | endpoint + protocol |
| Message | JSON string payload |

---

## create_topic

```python
from shop_aws.clients import client

sns = client("sns")
resp = sns.create_topic(Name="shop-notifications")
topic_arn = resp["TopicArn"]
```

Topic name unique per account/region. ARN нужен для publish и subscribe.

---

## subscribe

```python
# SQS endpoint — queue policy must allow SNS
sub = sns.subscribe(
    TopicArn=topic_arn,
    Protocol="sqs",
    Endpoint=queue_arn,
)
subscription_arn = sub["SubscriptionArn"]
```

| Protocol | Endpoint |
|----------|----------|
| `sqs` | queue ARN |
| `lambda` | function ARN |
| `email` | address (confirm in real AWS) |
| `https` | webhook URL |

SQS subscription: SNS wraps payload — consumer parse `Message` field (often double JSON).

---

## publish

```python
sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps({
        "event": "order.shipped",
        "order_id": "ord-42",
        "tracking": "1Z999",
    }),
    Subject="Order shipped",  # optional, email subs
)
```

| Parameter | Use |
|-----------|-----|
| `Message` | body string |
| `MessageAttributes` | filter + routing |
| `MessageStructure` | `json` for multi-format |

---

## SQS queue policy for SNS

SNS cannot deliver to SQS without policy:

```json
{
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "sns.amazonaws.com"},
    "Action": "sqs:SendMessage",
    "Resource": "arn:aws:sqs:us-east-1:000000000000:shop-events",
    "Condition": {
      "ArnEquals": {"aws:SourceArn": "arn:aws:sns:us-east-1:000000000000:shop-notifications"}
    }
  }]
}
```

LocalStack часто permissive — в AWS policy **обязателен**.

---

## Fan-out vs single queue

| SNS fan-out | Multiple sends to SQS |
|-------------|----------------------|
| add subscriber without code change | producer knows all queues |
| native parallel delivery | N API calls |
| filter per subscription | client-side routing |

---

## Message format on SQS from SNS

```json
{
  "Type": "Notification",
  "Message": "{\"event\":\"order.shipped\",\"order_id\":\"ord-42\"}",
  "TopicArn": "arn:aws:sns:...",
  "Timestamp": "..."
}
```

Worker:

```python
outer = json.loads(sqs_body)
inner = json.loads(outer["Message"])
```

---

## Filter policies (overview)

```python
sns.subscribe(
    TopicArn=topic_arn,
    Protocol="sqs",
    Endpoint=queue_arn,
    Attributes={
        "FilterPolicy": json.dumps({"event": ["order.shipped"]}),
    },
)
```

Only matching `MessageAttributes` delivered — saves consumer cost.

---

## SNS vs EventBridge

| SNS | EventBridge |
|-----|-------------|
| simple fan-out | content-based routing |
| push to subscribed targets | rules + many targets |
| high throughput notify | event bus architecture |

EventBridge — [29-eventbridge-boto3](29-eventbridge-boto3.md).

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Missing SQS policy | subscription silent / access denied |
| Parse SQS body as flat event | KeyError on order_id |
| Email sub unconfirmed | no delivery in AWS |
| Huge Message > 256KB | use S3 pointer pattern |

## Резюме

SNS — **pub/sub fan-out**: one `publish`, many subscriptions. SQS workers parse wrapped `Message`. Queue policy разрешает SNS SendMessage. Lab следующий — topic + notify pipeline.

Далее: [28-lab-sns-notify](28-lab-sns-notify.md).
