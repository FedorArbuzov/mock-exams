# 27. SNS boto3: publish, subscribe, fan-out

## Intro: "one event — three teams need to know about it"

Order shipped: email service, analytics, warehouse. A point-to-point SQS for each — the producer sends three times. An **SNS topic** — one `publish`, N subscribers (SQS, Lambda, HTTP, email). Fan-out decouples the **publisher** from the **consumers**.

LocalStack: SNS in the [`docker-compose.yml`](../../deploy/python-aws/docker-compose.yml) SERVICES.

## What you'll learn

- Topic, subscription, protocol.
- `publish` Message / MessageStructure.
- The SNS → SQS fan-out pattern.
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

The topic name is unique per account/region. The ARN is needed for publish and subscribe.

---

## subscribe

```python
# SQS endpoint — the queue policy must allow SNS
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

SQS subscription: SNS wraps the payload — the consumer parses the `Message` field (often double JSON).

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

SNS cannot deliver to SQS without a policy:

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

LocalStack is often permissive — in AWS the policy is **mandatory**.

---

## Fan-out vs single queue

| SNS fan-out | Multiple sends to SQS |
|-------------|----------------------|
| add a subscriber without code changes | the producer knows all queues |
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

Only messages with matching `MessageAttributes` are delivered — saves consumer cost.

---

## SNS vs EventBridge

| SNS | EventBridge |
|-----|-------------|
| simple fan-out | content-based routing |
| push to subscribed targets | rules + many targets |
| high-throughput notify | event bus architecture |

EventBridge — [29-eventbridge-boto3](29-eventbridge-boto3.md).

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Missing SQS policy | subscription silent / access denied |
| Parsing the SQS body as a flat event | KeyError on order_id |
| Email sub unconfirmed | no delivery in AWS |
| Huge Message > 256KB | use the S3 pointer pattern |

## Summary

SNS — **pub/sub fan-out**: one `publish`, many subscriptions. SQS workers parse the wrapped `Message`. The queue policy allows SNS SendMessage. The next lab — a topic + notify pipeline.

Next: [28-lab-sns-notify](28-lab-sns-notify.md).
