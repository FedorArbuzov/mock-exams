# 09. Queues and events: SQS, SNS, EventBridge

## Why messaging in the cloud

A synchronous call (API → API) breaks under load spikes and when a downstream service fails. **Asynchronous queues and events** decouple services:

```text
Producer → Queue → Consumer (scales independently)
Producer → Topic → many Subscribers
```

## SQS (Simple Queue Service)

A **message queue** — a pull model: the consumer fetches messages itself.

| Type | Feature |
|---|---|
| **Standard** | At-least-once, order not guaranteed, high throughput |
| **FIFO** | Exactly-once (within FIFO), strict order, `.fifo` suffix |

```text
API → SendMessage → SQS queue
                         ↓
                    Lambda / EC2 worker (ReceiveMessage, DeleteMessage after processing)
```

**Visibility timeout** — while a consumer is processing, the message is hidden; if it isn't deleted, it returns to the queue.

**Dead Letter Queue (DLQ)** — messages after N failed attempts → a separate queue for investigation.

## SNS (Simple Notification Service)

**Pub/Sub**: one publisher — many subscribers (SQS, Lambda, email, HTTP).

```text
OrderCreated event
    → SNS Topic "orders"
         ├── SQS (warehouse)
         ├── Lambda (analytics)
         └── Email (ops alert)
```

Fan-out: SNS can **duplicate** to several SQS queues (each with its own consumer).

## SQS vs SNS

| | SQS | SNS |
|---|---|---|
| Model | Queue (1 consumer group per queue) | Topic (many subscribers) |
| Delivery | Pull | Push |
| Typical use | Buffer, backpressure | Notifications, fan-out |

A common pattern: **SNS → multiple SQS** (each service its own queue).

## EventBridge

An **event bus** for cloud-native-style events:

- Events from AWS services (EC2 state change, S3 via an EventBridge rule).
- **Custom events** from your applications.
- **Rules** — filter by `detail-type`, `source` → target (Lambda, SQS, Step Functions).
- **Scheduler** — cron without a dedicated EC2.

```json
{
  "source": "my.app",
  "detail-type": "ImageProcessed",
  "detail": { "image_id": "abc-123", "status": "ok" }
}
```

EventBridge vs SNS: EventBridge is better for **routing and filtering** complex event schemas; SNS is simpler for fan-out notifications.

## Integration with Lambda

| Source | Behavior |
|---|---|
| SQS | Lambda polling batch (up to 10 messages), partial batch failure |
| SNS | Push on each message |
| EventBridge | Rule → Lambda with an event payload |

**Idempotency** is mandatory: SQS Standard may deliver a duplicate.

## S3 events (related to lessons 06–08)

Direct S3 → Lambda is possible. Often an SQS is added between them:

```text
S3 → SQS → Lambda
```

Benefit: a buffer during upload spikes; a DLQ for poison messages.

## Step Functions (mention)

Orchestration of a **workflow** (a chain of Lambda, wait, choice). For complex pipelines, instead of a "spaghetti" of Lambdas calling Lambdas.

## Local emulation

LocalStack / MiniStack emulate SQS, SNS, EventBridge. Queues and rules are created via Terraform just like in AWS.

## Checklist

- How does Standard SQS differ from FIFO?
- Why a DLQ?
- When SNS, when SQS?
- What does an EventBridge rule do?
- Why must a consumer be idempotent?

Next lesson: [10-local-emulation.md](10-local-emulation.md).
