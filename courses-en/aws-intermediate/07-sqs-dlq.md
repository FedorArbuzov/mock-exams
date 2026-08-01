# 07. SQS, DLQ, and backpressure

## Why a queue between S3 and Lambda

Direct **S3 → Lambda** breaks under upload spikes:

- Lambda concurrency limit
- Timeout on bulk uploads
- Hard to retry processing a single file

```text
S3 upload
    → (notification) → SQS queue
    → Lambda event source mapping (batch)
    → success: delete message
    → fail N times → DLQ
```

## SQS types

| Queue | Guarantees | Course |
|---|---|---|
| Standard | at-least-once, order not guaranteed | ✅ default |
| FIFO | ordering + dedup | separate `.fifo` names |

## Dead Letter Queue (DLQ)

```hcl
resource "aws_sqs_queue" "dlq" {
  name = "${var.project}-images-dlq"
}

resource "aws_sqs_queue" "work" {
  name = "${var.project}-images-work"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}
```

After **3** failed processing attempts the message goes to the DLQ for manual review.

## Lambda event source mapping

```hcl
resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = aws_sqs_queue.work.arn
  function_name    = aws_lambda_function.worker.arn
  batch_size       = 5
  enabled          = true

  function_response_types = ["ReportBatchItemFailures"]
}
```

**Partial batch failure** — only failed messages return to the queue (important for idempotency).

## Idempotency

SQS Standard can deliver a **duplicate**. Handler:

- derive `image_id` deterministically from the s3 key, or
- conditional write to DynamoDB.

## Monitoring

- `ApproximateNumberOfMessagesVisible` on the DLQ → alarm.
- CloudWatch metric for queue depth.

## Checklist

- Why SQS between S3 and Lambda?
- What does `maxReceiveCount` do?
- Why must the handler be idempotent?
- What is partial batch failure?

Next lesson: [08-lab-sqs-dlq.md](08-lab-sqs-dlq.md).
