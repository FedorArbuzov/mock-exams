# 24. Lab: S3 upload → Lambda → metadata in DynamoDB

## Scenario

A user uploads a file to `shop-uploads/uploads/`. The S3 notification invokes `process_s3_upload`. Lambda reads the first bytes and writes a row to `shop-items` with pk `file:{key}`.

**Goal:** an end-to-end pipeline on LocalStack; verify the DynamoDB item after the upload.

---

## Prerequisites

```bash
cd deploy/python-aws
docker compose up -d --build
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Step 1. Deploy the processor Lambda

```bash
docker exec mock-python-aws-lab bash -c "
  cd /app && zip -r /tmp/processor.zip shop_aws -x '*__pycache__*'
"
```

Use `deploy_hello.py` from [22-lab-lambda-invoke-boto3](22-lab-lambda-invoke-boto3.md) as a template:

- `FUNCTION = "shop-s3-processor"`
- `HANDLER = "shop_aws.lambda_handlers.handlers.process_s3_upload"`
- Environment: `SHOP_BUCKET`, `SHOP_TABLE`, `AWS_ENDPOINT_URL=http://localstack:4566`

---

## Step 2. Permission + notification

```python
# pipeline_setup.py — run once in the lab container
import json
from shop_aws.clients import client
from shop_aws.config import settings

lam = client("lambda")
s3 = client("s3")
fn = "shop-s3-processor"
bucket = settings.shop_bucket
arn = lam.get_function(FunctionName=fn)["Configuration"]["FunctionArn"]

try:
    lam.add_permission(
        FunctionName=fn,
        StatementId="allow-s3",
        Action="lambda:InvokeFunction",
        Principal="s3.amazonaws.com",
        SourceArn=f"arn:aws:s3:::{bucket}",
    )
except lam.exceptions.ResourceConflictException:
    pass

s3.put_bucket_notification_configuration(
    Bucket=bucket,
    NotificationConfiguration={
        "LambdaFunctionConfigurations": [{
            "LambdaFunctionArn": arn,
            "Events": ["s3:ObjectCreated:*"],
            "Filter": {"Key": {"FilterRules": [{"Name": "prefix", "Value": "uploads/"}]}},
        }],
    },
)
print("notification OK")
```

```bash
docker exec mock-python-aws-lab python pipeline_setup.py
```

---

## Step 3. Upload a test object

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
key = S3Service().put_bytes('uploads/lab-pipeline.bin', b'PIPELINE-DATA-12345', 'application/octet-stream')
print('uploaded', key)
"
```

---

## Step 4. Wait + verify DynamoDB

The LocalStack invoke may take 2–10 sec:

```bash
docker exec mock-python-aws-lab python -c "
import time
from shop_aws.dynamodb_repo import DynamoDBRepository

pk = 'file:uploads/lab-pipeline.bin'
repo = DynamoDBRepository()
for _ in range(10):
    item = repo.get_item(pk)
    if item:
        print(item)
        break
    time.sleep(1)
else:
    raise SystemExit('no item — check Lambda logs')
"
```

Expected fields: `bucket`, `key`, `size`, `preview_hex`.

---

## Step 5. Manual invoke fallback

If the notification didn't fire — simulate the event:

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.clients import client
from shop_aws.s3_service import S3Service

S3Service().put_bytes('uploads/manual.bin', b'manual-test')
event = {'Records': [{'s3': {
    'bucket': {'name': 'shop-uploads'},
    'object': {'key': 'uploads/manual.bin', 'size': 11},
}}]}
resp = client('lambda').invoke(
    FunctionName='shop-s3-processor',
    Payload=json.dumps(event).encode(),
)
print(resp['Payload'].read())
"
```

---

## Step 6. Idempotency check

Upload the **same key** again (overwrite) or re-invoke the event:

```python
item1 = repo.get_item(pk)
# trigger again
item2 = repo.get_item(pk)
assert item1["key"] == item2["key"]  # same pk, overwritten ok
```

---

## Step 7. Wrong prefix (negative test)

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
S3Service().put_bytes('other/no-trigger.bin', b'x')
"
```

Lambda should **not** be invoked — no DDB row `file:other/no-trigger.bin` (unless a manual invoke).

---

## Success criteria

- [ ] `shop-s3-processor` deployed with the correct handler
- [ ] S3 notification only for `uploads/`
- [ ] Upload → DDB item with preview_hex
- [ ] Manual event invoke works as a fallback
- [ ] You understand at-least-once and the idempotent pk

## Summary

Pipeline: **PutObject → S3 event → Lambda → DynamoDB**. Notification + permission are mandatory. A filter prefix saves invokes. Next — SQS queues for decoupling.

Next: [25-sqs-boto3](25-sqs-boto3.md).
