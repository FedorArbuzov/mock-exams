# 21. Lambda deploy: zip packaging, IAM role, boto3

## Intro: "create_function fails — Role cannot be assumed"

The zip is built without dependencies — `ImportModuleError: No module named shop_aws`. Or the role is created, but there is **no trust policy** for `lambda.amazonaws.com` — deploy fails. Lambda deployment = **artifact + IAM + runtime config**, not just a `.py` file.

Environment: LocalStack `:4566`, boto3 via [`shop_aws.clients`](../../deploy/python-aws/stack/shop_aws/clients.py).

## What you'll learn

- Zip layout for a Python Lambda.
- `create_function`, `update_function_code`.
- Execution role and trust policy.
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
└── (optional) boto3/ ... if not in the runtime
```

| Rule | Why |
|------|-----|
| Package root = zip root | `import shop_aws` works |
| Handler as a module path | `shop_aws.lambda_handlers.handlers.hello` |
| Pin deps | match LocalStack / AWS runtime version |

The LocalStack lab container **already** contains boto3 — for minimal handlers the zip is just `shop_aws/`.

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

Production: a Docker-based build ([aws-terraform build-lambda.sh](../aws-terraform/projects/image-pipeline/scripts/build-lambda.sh)).

---

## IAM execution role

Lambda assumes the role at runtime — permissions for S3, DynamoDB, logs.

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

LocalStack IAM is simplified — often `create_role` + an inline policy is enough.

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
| `Role` | ARN of the execution role |
| `Code.ZipFile` | bytes ≤ 50 MB (direct upload) |
| `Environment` | the Lambda container env — **not** the same as the lab shell unless set |

---

## update_function_code

After changing handlers:

```python
lam.update_function_code(
    FunctionName="shop-hello",
    ZipFile=zip_bytes,
)
```

Faster than a full recreate; the configuration (timeout, env) is preserved.

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

More in [23-lambda-s3-trigger](23-lambda-s3-trigger.md).

---

## LocalStack specifics

| Topic | LocalStack |
|-------|------------|
| `LAMBDA_DOCKER_NETWORK` | in [`docker-compose.yml`](../../deploy/python-aws/docker-compose.yml) — the Lambda container reaches localstack |
| Endpoint inside Lambda | `http://localstack:4566` not localhost |
| Services | `lambda,iam` in the SERVICES list |

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Wrong handler path | `Handler 'handler' missing on module` |
| Zip with a parent folder | `No module named shop_aws` |
| Role trust missing | cannot be assumed by Lambda |
| Lambda uses localhost:4566 | connection refused from the Lambda container |

## Summary

Deploy Lambda = **zip (shop_aws) + IAM role + create_function**. The handler — a dotted path to the function. Env vars set the endpoint and resource names inside the execution environment. The next lab — invoke via boto3.

Next: [22-lab-lambda-invoke-boto3](22-lab-lambda-invoke-boto3.md).
