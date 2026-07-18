# 24. Лаба: S3 upload → Lambda → metadata в DynamoDB

## Сценарий

Пользователь загружает файл в `shop-uploads/uploads/`. S3 notification вызывает `process_s3_upload`. Lambda читает первые байты, пишет строку в `shop-items` с pk `file:{key}`.

**Цель:** end-to-end pipeline на LocalStack; verify DynamoDB item после upload.

---

## Предусловия

```bash
cd deploy/python-aws
docker compose up -d --build
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Шаг 1. Deploy processor Lambda

```bash
docker exec mock-python-aws-lab bash -c "
  cd /app && zip -r /tmp/processor.zip shop_aws -x '*__pycache__*'
"
```

Используйте `deploy_hello.py` из [22-lab-lambda-invoke-boto3](22-lab-lambda-invoke-boto3.md) как шаблон:

- `FUNCTION = "shop-s3-processor"`
- `HANDLER = "shop_aws.lambda_handlers.handlers.process_s3_upload"`
- Environment: `SHOP_BUCKET`, `SHOP_TABLE`, `AWS_ENDPOINT_URL=http://localstack:4566`

---

## Шаг 2. Permission + notification

```python
# pipeline_setup.py — run once in lab container
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

## Шаг 3. Upload test object

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
key = S3Service().put_bytes('uploads/lab-pipeline.bin', b'PIPELINE-DATA-12345', 'application/octet-stream')
print('uploaded', key)
"
```

---

## Шаг 4. Wait + verify DynamoDB

LocalStack invoke может занять 2–10 сек:

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

Ожидаемые поля: `bucket`, `key`, `size`, `preview_hex`.

---

## Шаг 5. Manual invoke fallback

Если notification не сработала — симулируйте event:

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

## Шаг 6. Idempotency check

Upload **тот же key** повторно (overwrite) или re-invoke event:

```python
item1 = repo.get_item(pk)
# trigger again
item2 = repo.get_item(pk)
assert item1["key"] == item2["key"]  # same pk, overwritten ok
```

---

## Шаг 7. Wrong prefix (negative test)

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
S3Service().put_bytes('other/no-trigger.bin', b'x')
"
```

Lambda **не** должна вызваться — no DDB row `file:other/no-trigger.bin` (unless manual invoke).

---

## Критерии приёмки

- [ ] `shop-s3-processor` deployed с правильным handler
- [ ] S3 notification только `uploads/`
- [ ] Upload → DDB item с preview_hex
- [ ] Manual event invoke работает как fallback
- [ ] Понимаете at-least-once и idempotent pk

## Резюме

Pipeline: **PutObject → S3 event → Lambda → DynamoDB**. Notification + permission обязательны. Filter prefix экономит invoke. Дальше — очереди SQS для decoupling.

Далее: [25-sqs-boto3](25-sqs-boto3.md).
