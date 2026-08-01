# 18. Lab: build the pipeline manually

Combine lessons 10–16 into a single directory `~/aws-labs/lesson-18`.

## Task 1. Structure

```text
lesson-18/
  versions.tf
  provider.tf
  variables.tf
  iam.tf
  s3.tf
  dynamodb.tf
  lambda.tf
  notification.tf
  lambda/handler.py
```

## Task 2. handler.py (simplified)

Copy the handler from [`projects/image-pipeline/lambda/handler.py`](projects/image-pipeline/lambda/handler.py) or implement one that:

- reads the S3 event;
- copies the object to `thumbs/` (without Pillow);
- writes `image_id`, `s3_key`, `thumb_key` to DynamoDB.

## Task 3. notification.tf

`filter_prefix = "uploads/"`, `events = ["s3:ObjectCreated:*"]`, `depends_on` the permission.

## Task 4. E2E test

```bash
tflocal apply
aws --endpoint-url=http://localhost:4566 s3 cp fixtures/sample.jpg s3://BUCKET/uploads/e2e.jpg
sleep 5
aws --endpoint-url=http://localhost:4566 s3 ls s3://BUCKET/thumbs/
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name TABLE_NAME
```

**What you'll see:** an object in `thumbs/`, a record in DynamoDB.

## Task 5. Debugging

If the Lambda wasn't invoked:

```bash
docker compose -f deploy/localstack/docker-compose.yml logs localstack | tail -50
aws --endpoint-url=http://localhost:4566 lambda list-event-source-mappings
```

Check the permission and notification in the Terraform state.

## Success criteria

- [ ] An upload to `uploads/` triggers the Lambda
- [ ] An object appeared in `thumbs/`
- [ ] DynamoDB contains the metadata

Next lesson: [19-modules.md](19-modules.md).
