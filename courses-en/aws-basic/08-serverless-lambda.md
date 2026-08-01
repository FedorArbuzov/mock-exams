# 08. Serverless and Lambda

## What serverless is

**Serverless** — you write the **code**, AWS manages the **servers**, scaling, and (partly) availability. You pay for **invocations and execution time**, not for idle VMs.

The main service is **AWS Lambda**. Alongside it: API Gateway, Step Functions, EventBridge.

## Lambda: execution model

```text
Trigger (S3, API Gateway, SQS, schedule, ...)
    → Lambda service
        → Container with your runtime (cold / warm start)
        → Handler runs
        → Result / error
```

| Parameter | Typical value |
|---|---|
| **Runtime** | Python 3.12, Node 20, Go custom, etc. |
| **Memory** | 128 MB – 10 GB (affects CPU) |
| **Timeout** | up to 15 minutes |
| **Deployment package** | zip or container image |
| **Concurrency** | Limit per account and reserved per function |

## Cold and warm start

- **Cold start** — the first invocation or after idle time: download the image, initialize the runtime.
- **Warm** — subsequent invocations are faster; AWS may keep the sandbox alive.

For latency-critical APIs — provisioned concurrency (paid).

## Triggers (event sources)

| Source | Scenario |
|---|---|
| **S3** | New object → processing |
| **API Gateway / Function URL** | HTTP API |
| **SQS** | Message queue |
| **EventBridge** | Cron, events from other services |
| **DynamoDB Streams** | Reacting to table changes |

The course's final project: **S3 ObjectCreated → Lambda → resize → DynamoDB**.

## IAM and VPC

- Lambda **must** have an **execution role** (`lambda.amazonaws.com` + policies).
- Access to S3/DynamoDB — via an IAM policy on the role.
- Lambda **in a VPC** (for RDS): needs an ENI, cold start is longer, needs NAT for internet access.

For S3 + DynamoDB a VPC is **not needed** (public AWS APIs).

## API Gateway (briefly)

```text
Client HTTPS
    → API Gateway (REST / HTTP API)
    → Lambda integration
    → Response
```

HTTP API is cheaper than REST API. For a learning API, an HTTP API or a **Lambda Function URL** is enough.

## Limitations and anti-patterns

Not suitable for:

- Long CPU-bound tasks without splitting (> 15 min).
- Stateful long connections (WebSocket — handled separately).
- Sustained high RPS without accounting for concurrency limits.

Suitable for:

- File processing, webhooks, CRUD APIs with low/medium load.
- Glue between S3, SQS, DynamoDB.

## Example flow (resize image)

```python
# Handler pseudocode
def handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]
        image = download_s3(bucket, key)
        thumb = resize(image, max_width=800)
        put_s3(bucket, f"thumbs/{key}", thumb)
        dynamodb.put_item(TableName="images", Item={...})
```

Dependencies: a **Lambda Layer** (Pillow) or a container image.

## Monitoring

- **CloudWatch Logs** — stdout/stderr automatically.
- **CloudWatch Metrics** — Invocations, Errors, Duration.
- **X-Ray** — tracing (optional).

## Cost (real AWS)

- The first N invocations — Free Tier.
- Charged per GB-second and number of requests.
- S3 GET/PUT and DynamoDB writes — billed separately.

In LocalStack — no bill.

## Checklist

- What do you pay for in Lambda, and what don't you pay for?
- Why an execution role?
- When does Lambda need a VPC?
- Name 3 trigger types.
- What is a cold start?

Next lesson: [09-messaging.md](09-messaging.md).
