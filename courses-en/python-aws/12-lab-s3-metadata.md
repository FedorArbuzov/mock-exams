# 12. Lab: S3 metadata and tags

## Scenario

Compliance requires: every upload has an **owner_id**, **retention_days**, and searchable **tags**. S3 stores user metadata and object tagging — separately from `ContentType`.

**Goal:** put with Metadata, read metadata on get, put/get tagging; simulate the handler metadata flow.

---

## Step 1. User-defined Metadata

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
from shop_aws.config import settings

s3 = client('s3')
s3.put_object(
    Bucket=settings.shop_bucket,
    Key='lab/meta-invoice.pdf',
    Body=b'%PDF-1.4 fake',
    ContentType='application/pdf',
    Metadata={'owner-id': 'user-42', 'retention-days': '90'},
)

head = s3.head_object(Bucket=settings.shop_bucket, Key='lab/meta-invoice.pdf')
print('Metadata:', head.get('Metadata'))
print('ContentType:', head.get('ContentType'))
"
```

**Note:** keys are lowercased in HTTP; boto3 returns them as you passed them.

---

## Step 2. Metadata size limit

| Limit | Value |
|-------|-------|
| User metadata keys | 2 KB total (UTF-8) |
| Tagging | 10 tags, key+value ≤ 256 chars |

Large attrs → a DynamoDB sidecar (the `file:{key}` pattern from the handler).

---

## Step 3. Object tagging

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
from shop_aws.config import settings

s3 = client('s3')
key = 'lab/tagged-object.txt'
s3.put_object(Bucket=settings.shop_bucket, Key=key, Body=b'tagged')
s3.put_object_tagging(
    Bucket=settings.shop_bucket, Key=key,
    Tagging={'TagSet': [
        {'Key': 'env', 'Value': 'lab'},
        {'Key': 'team', 'Value': 'platform'},
    ]},
)
print(s3.get_object_tagging(Bucket=settings.shop_bucket, Key=key)['TagSet'])
"
```

Tags are for **lifecycle rules** and cost allocation in AWS Billing.

---

## Step 4. Handler-style metadata record

```python
from shop_aws.s3_service import S3Service
from shop_aws.dynamodb_repo import DynamoDBRepository
from shop_aws.clients import client
from shop_aws.config import settings

key = "lab/handler-sim.bin"
S3Service().put_bytes(key, b"\x00\x01\x02\x03", content_type="application/octet-stream")
head = client("s3").head_object(Bucket=settings.shop_bucket, Key=key)
DynamoDBRepository().put_item(
    pk=f"file:{key}",
    data={"bucket": settings.shop_bucket, "key": key, "size": head["ContentLength"]},
)
```

---

## Success criteria

- [ ] Metadata round-trip via head_object
- [ ] put_object_tagging / get_object_tagging
- [ ] DDB record `file:{key}` with size
- [ ] You understand the 2 KB metadata limit

Next: [13-dynamodb-boto3-crud](13-dynamodb-boto3-crud.md).
