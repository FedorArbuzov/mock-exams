# 16. Lab: DynamoDB table

## Task 1. dynamodb.tf

A `course-lab-images` table with `image_id` (String), on-demand billing.

## Task 2. output

```hcl
output "dynamodb_table_name" {
  value = aws_dynamodb_table.images.name
}
```

## Task 3. put_item via CLI

```bash
aws --endpoint-url=http://localhost:4566 dynamodb put-item \
  --table-name course-lab-images \
  --item '{"image_id":{"S":"test-001"},"s3_key":{"S":"uploads/a.jpg"}}'

aws --endpoint-url=http://localhost:4566 dynamodb get-item \
  --table-name course-lab-images \
  --key '{"image_id":{"S":"test-001"}}'
```

## Task 4. Extend the Lambda (optional)

In the handler, add `boto3.resource("dynamodb")` and `put_item` on invoke with the body `{"image_id": "manual-1"}`.

## Success criteria

- [ ] Table ACTIVE
- [ ] get-item returns the record
- [ ] destroy removes the table

Next lesson: [17-s3-lambda-pipeline.md](17-s3-lambda-pipeline.md).
