# 29. EventBridge boto3: put_events, rules, targets

## Intro: "SNS can't route by the status field"

Ten events in one topic — analytics wants only `order.completed`, audit wants everything. SNS filter policies are possible, but **EventBridge** is an event bus with **content-based rules**, transformation, scheduled events, and SaaS integration.

LocalStack: service `events` in compose ([`docker-compose.yml`](../../deploy/python-aws/docker-compose.yml)).

## What you'll learn

- Custom event bus vs default.
- `put_events` entry structure.
- Rules, patterns, targets (SQS, Lambda).
- EventBridge vs SNS vs SQS.

---

## Event model

```json
{
  "Source": "shop.orders",
  "DetailType": "Order Paid",
  "Detail": "{\"order_id\":\"ord-1\",\"amount\":50}",
  "EventBusName": "default"
}
```

| Field | Meaning |
|-------|---------|
| `Source` | namespace (dots) |
| `DetailType` | human-readable type |
| `Detail` | JSON **string** |
| `EventBusName` | `default` or custom |

Consumers match **rules** on these fields.

---

## put_events

```python
import json
from shop_aws.clients import client

events = client("events")
resp = events.put_events(Entries=[{
    "Source": "shop.orders",
    "DetailType": "Order Paid",
    "Detail": json.dumps({"order_id": "ord-eb-1", "amount": 120}),
    "EventBusName": "default",
}])
print(resp["FailedEntryCount"])  # must be 0
```

Batch up to 10 entries per call. Partial failure → check `Entries` in the response.

---

## Create rule

```python
events.put_rule(
    Name="shop-order-paid",
    EventPattern=json.dumps({
        "source": ["shop.orders"],
        "detail-type": ["Order Paid"],
    }),
    State="ENABLED",
)
```

| Pattern | Matches |
|---------|---------|
| `source` | exact source list |
| `detail-type` | type filter |
| `detail.status` | field inside the Detail JSON |

---

## Add target (SQS)

```python
queue_arn = "arn:aws:sqs:us-east-1:000000000000:shop-events"
events.put_targets(
    Rule="shop-order-paid",
    Targets=[{"Id": "1", "Arn": queue_arn}],
)
```

The SQS queue policy must allow `events.amazonaws.com` — similar to SNS.

Lambda target: pass `Input` / `InputPath` / `InputTransformer`.

---

## Architecture: S3 → EventBridge

AWS supports S3 Event Notifications → **EventBridge** (optional path):

```text
S3 ObjectCreated → EventBridge default bus → rule → SQS/Lambda
```

Vs direct S3→Lambda ([23-lambda-s3-trigger](23-lambda-s3-trigger.md)): EventBridge adds **routing** without new SNS topics.

---

## Scheduled rules (overview)

```python
events.put_rule(
    Name="hourly-cleanup",
    ScheduleExpression="rate(1 hour)",
    State="ENABLED",
)
```

Cron/rate triggers Lambda — like Celery Beat without an app server.

---

## Comparison table

| Service | Best for |
|---------|----------|
| SQS | work queue, buffering |
| SNS | blind fan-out notify |
| EventBridge | routing, schedules, SaaS |
| Lambda | compute on event |

---

## LocalStack notes

EventBridge emulation is **partial** — test the happy path; verify edge cases against the AWS docs. `put_events` + an SQS target usually works in LocalStack 3.x.

---

## Idempotency

EventBridge is **at-least-once** to targets — same as SQS/Lambda. Design consumers to be idempotent ([18-lab-idempotent-ddb](18-lab-idempotent-ddb.md)).

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Detail as a dict, not a string | PutEvents validation error |
| Rule pattern typo | no delivery |
| Missing target queue policy | rule matches, queue empty |
| Wrong EventBusName | silent drop |

## Summary

EventBridge = **structured events + rules + targets**. `put_events` publishes; rules filter by source/type/detail. An alternative to SNS for complex routing. Lab — S3 or custom events → SQS pipeline.

Next: [30-lab-event-pipeline](30-lab-event-pipeline.md).
