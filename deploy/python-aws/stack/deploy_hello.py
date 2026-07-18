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
    return json.loads(resp["Payload"].read())


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
