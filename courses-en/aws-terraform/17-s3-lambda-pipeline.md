# 17. Pipeline: S3 → Lambda → DynamoDB

## Architecture

```text
Client
  │  PUT uploads/photo.jpg
  ▼
S3 bucket
  │  ObjectCreated event
  ▼
Lambda (resize + metadata)
  ├── PUT thumbs/photo.jpg  → S3
  └── PutItem               → DynamoDB
```

## S3 event flow

S3 passes the Lambda a batch of records:

```json
{
  "Records": [{
    "s3": {
      "bucket": { "name": "my-bucket" },
      "object": { "key": "uploads/photo.jpg", "size": 12345 }
    }
  }]
}
```

The handler must:

1. Decode the key (URL encoding: `+` → space).
2. Download the object (`get_object`).
3. Process it (resize, or copy in the teaching version).
4. Write the thumb and metadata.
5. Idempotency: a repeated event must not corrupt the data.

## Terraform apply order

```text
1. IAM role + policies
2. S3 bucket + public block + encryption
3. DynamoDB table
4. Lambda function + log group
5. aws_lambda_permission (S3 → Lambda)
6. aws_s3_bucket_notification
```

## DLQ (optional)

On a Lambda error — a **Dead Letter Queue** (SQS):

```hcl
resource "aws_lambda_function" "resize" {
  # ...
  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }
}
```

+ IAM permission to send to SQS.

## LocalStack limitations

- A Lambda cold start in Docker can be slow.
- Pillow in Lambda on LocalStack — build the zip locally ([projects/image-pipeline](projects/image-pipeline/)).
- Some notification filters work differently — test on real AWS before prod.

## Checklist

- Why `aws_lambda_permission` before the notification?
- Which prefix/suffix should you restrict for uploads?
- Why must the handler be idempotent?

Next lesson: [18-lab-s3-lambda-pipeline.md](18-lab-s3-lambda-pipeline.md).
