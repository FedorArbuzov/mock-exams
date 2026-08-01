# 36. Capstone: Image Pipeline (Python + boto3)

## Goal

Build an **event-driven image pipeline** on the [`deploy/python-aws`](../../deploy/python-aws/README.md) stand — a Python equivalent of the [aws-terraform image pipeline](../aws-terraform/23-final-project.md):

1. Upload a JPEG to `s3://shop-uploads/uploads/`.
2. Lambda resize → thumb in `thumbs/`.
3. Metadata in DynamoDB (`shop-items` or a separate table).
4. pytest moto + smoke script.

**Time:** 4–6 hours.

---

## Architecture

```text
                    ┌─────────────────┐
                    │  S3 shop-uploads│
                    │  uploads/*.jpg  │
                    └────────┬────────┘
                             │ ObjectCreated
                             ▼
                    ┌─────────────────┐
                    │ Lambda resize   │
                    │ Pillow optional │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        S3 thumbs/*    DynamoDB         CloudWatch Logs
                       pk=image:{uuid}
```

Optional bonus: SNS notify `image.processed`, SQS DLQ for failed Lambda.

---

## Functional requirements

| # | Feature |
|---|---------|
| 1 | Handler `resize_image` in `shop_aws/lambda_handlers/` |
| 2 | S3 notification: prefix `uploads/`, suffix `.jpg` |
| 3 | Thumb max width 800px, prefix `thumbs/` |
| 4 | DDB item: `image_id`, `source_key`, `thumb_key`, `width`, `height` |
| 5 | IAM role: S3 read/write prefix, DDB put, logs |
| 6 | Deploy script `deploy_capstone.py` (zip + create_function) |
| 7 | pytest: handler unit test with moto + fake JPEG bytes |
| 8 | README ops section in `stack/CAPSTONE.md` (local) |

---

## Non-functional

| # | Requirement |
|---|-------------|
| N1 | Idempotent: same source key → overwrite or skip via pk |
| N2 | `urllib.parse.unquote_plus` on keys |
| N3 | Secrets not in zip — env only |
| N4 | LocalStack endpoint `http://localstack:4566` inside Lambda |
| N5 | Structured logging with `image_id` |

---

## Reference handler (sketch)

Adapt from the [aws-terraform handler](../aws-terraform/projects/image-pipeline/lambda/handler.py):

```python
def resize_image(event, context):
    import io, json, uuid, urllib.parse
    from shop_aws.clients import client
    from shop_aws.config import settings
    from shop_aws.dynamodb_repo import DynamoDBRepository

    s3 = client("s3")
    table = DynamoDBRepository()
    thumb_prefix = "thumbs/"
    max_w = 800

    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        body = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        image_id = str(uuid.uuid4())
        thumb_key = f"{thumb_prefix}{image_id}.jpg"
        # resize with Pillow or passthrough for lab
        s3.put_object(Bucket=bucket, Key=thumb_key, Body=body, ContentType="image/jpeg")
        table.put_item(
            pk=f"image:{image_id}",
            data={"source_key": key, "thumb_key": thumb_key, "width": 0, "height": 0},
        )
    return {"statusCode": 200, "processed": len(event.get("Records", []))}
```

Add Pillow to `requirements.txt` if real resize required.

---

## Phases

### Phase 1 — Handler + local test (1h)

moto test: put fake jpg, invoke handler with synthetic S3 event, assert DDB row + thumb key exists.

### Phase 2 — Deploy LocalStack (1.5h)

Extend [22-lab-lambda-invoke-boto3](22-lab-lambda-invoke-boto3.md): zip with Pillow layer or slim passthrough; notification + permission from [24-lab-s3-lambda-pipeline](24-lab-s3-lambda-pipeline.md).

### Phase 3 — E2E smoke (1h)

```bash
cd deploy/python-aws
docker compose up -d --build
docker exec mock-python-aws-lab python lab_cli.py bootstrap
docker exec mock-python-aws-lab python deploy_capstone.py
# upload test jpg
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
S3Service().put_bytes('uploads/capstone.jpg', open('/app/test.jpg','rb').read(), 'image/jpeg')
"
# verify thumb + DDB
```

### Phase 4 — Quality (1h)

pytest ≥6 tests; document failure modes (Pillow missing, wrong suffix).

### Phase 5 — Optional (+2h)

- Presigned upload URL ([10-lab-presigned-url](10-lab-presigned-url.md))
- EventBridge rule on custom `Image Processed` event
- SNS email fan-out mock

---

## Success criteria

```bash
cd deploy/python-aws
docker compose up -d --build
bash scripts/smoke.sh
docker exec mock-python-aws-lab pytest tests/ -v
```

| Check | Pass |
|-------|------|
| Upload `uploads/*.jpg` triggers Lambda | ✓ |
| Object exists under `thumbs/` | ✓ |
| DynamoDB scan/query finds `image:*` | ✓ |
| pytest moto green | ✓ |
| Idempotent re-upload handled | ✓ |

---

## Moving to real AWS

1. Remove `AWS_ENDPOINT_URL`.
2. Real IAM user/role with budget alert $5–10.
3. Unique bucket name globally.
4. Enable S3 block public access + encryption.

---

## Submission

- Handler + deploy script
- pytest files
- Screenshot or log: DDB item after upload
- 1-page CAPSTONE.md with commands

---

## Reflection

| Question | Goal |
|----------|------|
| Why idempotent pk? | at-least-once S3 events |
| moto vs LocalStack in CI? | speed vs fidelity |
| When EventBridge over direct Lambda? | multiple routing rules |

Congratulations — the **python-aws** track (01–36) is complete. IaC version: [aws-terraform/23-final-project](../aws-terraform/23-final-project.md).
