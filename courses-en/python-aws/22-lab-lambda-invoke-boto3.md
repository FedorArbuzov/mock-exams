# 22. Lab: create a function and invoke via boto3

## Scenario

The `hello` handler is tested locally ([20-lab-hello-lambda](20-lab-hello-lambda.md)). Now: package into a zip, `create_function` in LocalStack, **`lambda.invoke`** with a JSON payload — the full cycle like in CI/CD.

**Goal:** the `shop-hello` function is created and returns the expected JSON in `Payload`.

---

## Step 1. Bootstrap + zip

```bash
docker exec mock-python-aws-lab python lab_cli.py bootstrap
docker exec mock-python-aws-lab bash -c "
  cd /app && zip -r /tmp/lambda.zip shop_aws -x '*__pycache__*' '*.pyc'
"
```

---

## Step 2. deploy_hello.py

Create it in `stack/` (or one-off via a heredoc in the container):

```python
#!/usr/bin/env python3
"""Deploy shop-hello to LocalStack and invoke once."""
import json
import zipfile
from io import BytesIO
from pathlib import Path

from shop_aws.clients import client

FUNCTION = "shop-hello"
HANDLER = "shop_aws.lambda_handlers.handlers.hello"
ROLE_NAME = "shop-lambda-exec"


def build_zip() -> bytes:
    buf = BytesIO()
    root = Path("/app/shop_aws")
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in root.rglob("*.py"):
            zf.write(path, path.relative_to("/app"))
    return buf.getvalue()


def ensure_role(iam):
    trust = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole",
        }],
    }
    try:
        role = iam.get_role(RoleName=ROLE_NAME)["Role"]
    except iam.exceptions.NoSuchEntityException:
        role = iam.create_role(
            RoleName=ROLE_NAME,
            AssumeRolePolicyDocument=json.dumps(trust),
        )["Role"]
        iam.put_role_policy(
            RoleName=ROLE_NAME,
            PolicyName="shop-lab",
            PolicyDocument=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Action": "*", "Resource": "*"}],
            }),
        )
    return role["Arn"]


def ensure_function(lam, role_arn: str, zip_bytes: bytes):
    try:
        lam.get_function(FunctionName=FUNCTION)
        lam.update_function_code(FunctionName=FUNCTION, ZipFile=zip_bytes)
    except lam.exceptions.ResourceNotFoundException:
        lam.create_function(
            FunctionName=FUNCTION,
            Runtime="python3.12",
            Role=role_arn,
            Handler=HANDLER,
            Code={"ZipFile": zip_bytes},
            Timeout=30,
            Environment={"Variables": {
                "AWS_ENDPOINT_URL": "http://localstack:4566",
                "AWS_DEFAULT_REGION": "us-east-1",
                "AWS_ACCESS_KEY_ID": "test",
                "AWS_SECRET_ACCESS_KEY": "test",
            }},
        )


def invoke(lam, payload: dict) -> dict:
    resp = lam.invoke(
        FunctionName=FUNCTION,
        InvocationType="RequestResponse",
        Payload=json.dumps(payload).encode(),
    )
    raw = resp["Payload"].read()
    return json.loads(raw)


def main():
    iam = client("iam")
    lam = client("lambda")
    role_arn = ensure_role(iam)
    zip_bytes = build_zip()
    ensure_function(lam, role_arn, zip_bytes)
    out = invoke(lam, {"name": "boto3"})
    print(json.dumps(out, indent=2))
    assert out["statusCode"] == 200
    body = json.loads(out["body"])
    assert "boto3" in body["message"]
    print("invoke OK")


if __name__ == "__main__":
    main()
```

```bash
docker exec mock-python-aws-lab python deploy_hello.py
```

---

## Step 3. Async invoke (fire-and-forget)

```python
resp = lam.invoke(
    FunctionName="shop-hello",
    InvocationType="Event",
    Payload=json.dumps({"name": "async"}).encode(),
)
print(resp["StatusCode"])  # 202
```

The Payload response is **empty** — check the logs (LocalStack CloudWatch emulation).

---

## Step 4. List functions

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
for fn in client('lambda').list_functions()['Functions']:
    print(fn['FunctionName'], fn['Runtime'], fn['Handler'])
"
```

---

## Step 5. FunctionError debugging

On an error in the handler:

```python
resp = lam.invoke(...)
if "FunctionError" in resp:
    print(resp["FunctionError"])  # Unhandled
    print(resp["Payload"].read())
```

Typical: ImportError, missing env, wrong endpoint.

---

## Step 6. Cleanup (optional)

```python
client("lambda").delete_function(FunctionName="shop-hello")
```

Before rerunning the lab with a different handler name.

---

## Success criteria

- [ ] The zip contains `shop_aws/` at root
- [ ] IAM role `shop-lambda-exec` is created
- [ ] `shop-hello` invoke → Hello, boto3!
- [ ] You understand RequestResponse vs Event
- [ ] On an error you read `FunctionError` + Payload

## Summary

The full deploy loop: **zip → role → create_function → invoke**. boto3 `lambda.invoke` — the same API as AWS CLI `aws lambda invoke`. Next — S3 trigger and `process_s3_upload`.

Next: [23-lambda-s3-trigger](23-lambda-s3-trigger.md).
