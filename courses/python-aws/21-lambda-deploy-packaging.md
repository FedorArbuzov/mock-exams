# 21. Lambda deploy: zip packaging, IAM role, boto3

## Введение: «create_function падает — Role cannot be assumed»

Zip собран без зависимостей — `ImportModuleError: No module named shop_aws`. Или role создан, но **нет trust policy** `lambda.amazonaws.com` — deploy fail. Lambda deployment = **artifact + IAM + runtime config**, не только `.py` файл.

Стенд: LocalStack `:4566`, boto3 через [`shop_aws.clients`](../../deploy/python-aws/stack/shop_aws/clients.py).

## Что вы узнаете

- Zip layout для Python Lambda.
- `create_function`, `update_function_code`.
- Execution role и trust policy.
- Handler string, runtime, timeout, environment.

---

## Zip layout

```text
lambda.zip
├── shop_aws/
│   ├── __init__.py
│   ├── config.py
│   ├── clients.py
│   ├── s3_service.py
│   ├── dynamodb_repo.py
│   └── lambda_handlers/
│       ├── __init__.py
│       └── handlers.py
└── (optional) boto3/ ... если не в runtime
```

| Rule | Why |
|------|-----|
| Package root = zip root | `import shop_aws` works |
| Handler as module path | `shop_aws.lambda_handlers.handlers.hello` |
| Pin deps | match LocalStack / AWS runtime version |

LocalStack lab container **уже** содержит boto3 — для minimal handlers zip только `shop_aws/`.

---

## Build zip (lab script)

```bash
docker exec mock-python-aws-lab bash -c "
  cd /app && rm -f /tmp/lambda.zip
  zip -r /tmp/lambda.zip shop_aws -x '*__pycache__*' '*.pyc'
  unzip -l /tmp/lambda.zip | head
"
```

Windows host alternative:

```powershell
cd deploy\python-aws\stack
Compress-Archive -Path shop_aws -DestinationPath lambda.zip -Force
```

Production: Docker-based build ([aws-terraform build-lambda.sh](../aws-terraform/projects/image-pipeline/scripts/build-lambda.sh)).

---

## IAM execution role

Lambda assumes role at runtime — permissions for S3, DynamoDB, logs.

Trust policy (conceptual JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
```

Attached policy (lab — broad; prod — least privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetObject", "s3:PutObject",
      "dynamodb:PutItem", "dynamodb:GetItem",
      "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"
    ],
    "Resource": "*"
  }]
}
```

LocalStack IAM упрощён — часто `create_role` + inline policy достаточно.

---

## boto3 create_function

```python
import zipfile
from pathlib import Path
from shop_aws.clients import client

lam = client("lambda")
iam = client("iam")

role = iam.create_role(
    RoleName="shop-lambda-exec",
    AssumeRolePolicyDocument='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
)
iam.put_role_policy(
    RoleName="shop-lambda-exec",
    PolicyName="shop-policy",
    PolicyDocument='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:*","dynamodb:*","logs:*"],"Resource":"*"}]}',
)

zip_bytes = Path("/tmp/lambda.zip").read_bytes()
fn = lam.create_function(
    FunctionName="shop-hello",
    Runtime="python3.12",
    Role=role["Role"]["Arn"],
    Handler="shop_aws.lambda_handlers.handlers.hello",
    Code={"ZipFile": zip_bytes},
    Timeout=30,
    Environment={"Variables": {
        "AWS_ENDPOINT_URL": "http://localstack:4566",
        "SHOP_BUCKET": "shop-uploads",
        "SHOP_TABLE": "shop-items",
    }},
)
```

| Parameter | Note |
|-----------|------|
| `Runtime` | python3.12 / 3.11 |
| `Role` | ARN execution role |
| `Code.ZipFile` | bytes ≤ 50 MB (direct upload) |
| `Environment` | Lambda container env — **not** same as lab shell unless set |

---

## update_function_code

После изменения handlers:

```python
lam.update_function_code(
    FunctionName="shop-hello",
    ZipFile=zip_bytes,
)
```

Быстрее full recreate; configuration (timeout, env) сохраняется.

---

## S3 trigger permission (preview)

Before S3 invokes Lambda:

```python
lam.add_permission(
    FunctionName="shop-hello",
    StatementId="s3invoke",
    Action="lambda:InvokeFunction",
    Principal="s3.amazonaws.com",
    SourceArn="arn:aws:s3:::shop-uploads",
)
```

Подробнее: [23-lambda-s3-trigger](23-lambda-s3-trigger.md).

---

## LocalStack specifics

| Topic | LocalStack |
|-------|------------|
| `LAMBDA_DOCKER_NETWORK` | в [`docker-compose.yml`](../../deploy/python-aws/docker-compose.yml) — Lambda container reaches localstack |
| Endpoint inside Lambda | `http://localstack:4566` not localhost |
| Services | `lambda,iam` in SERVICES list |

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Wrong handler path | `Handler 'handler' missing on module` |
| Zip with parent folder | `No module named shop_aws` |
| Role trust missing | cannot be assumed by Lambda |
| Lambda uses localhost:4566 | connection refused from Lambda container |

## Резюме

Deploy Lambda = **zip (shop_aws) + IAM role + create_function**. Handler — dotted path к функции. Env vars задают endpoint и resource names внутри execution environment. Следующая лаба — invoke через boto3.

Далее: [22-lab-lambda-invoke-boto3](22-lab-lambda-invoke-boto3.md).
