#!/usr/bin/env python3
"""Wire S3 bucket notification to shop-s3-processor Lambda."""

import json
import zipfile
from io import BytesIO
from pathlib import Path

from shop_aws.clients import client
from shop_aws.config import settings

FUNCTION = "shop-s3-processor"
HANDLER = "shop_aws.lambda_handlers.handlers.process_s3_upload"
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


def ensure_processor(lam, role_arn: str, zip_bytes: bytes):
    env = {
        "AWS_ENDPOINT_URL": "http://localstack:4566",
        "AWS_DEFAULT_REGION": settings.region,
        "AWS_ACCESS_KEY_ID": settings.access_key,
        "AWS_SECRET_ACCESS_KEY": settings.secret_key,
        "SHOP_BUCKET": settings.shop_bucket,
        "SHOP_TABLE": settings.shop_table,
    }
    try:
        lam.get_function(FunctionName=FUNCTION)
        lam.update_function_code(FunctionName=FUNCTION, ZipFile=zip_bytes)
        lam.update_function_configuration(FunctionName=FUNCTION, Environment={"Variables": env})
    except lam.exceptions.ResourceNotFoundException:
        lam.create_function(
            FunctionName=FUNCTION,
            Runtime="python3.12",
            Role=role_arn,
            Handler=HANDLER,
            Code={"ZipFile": zip_bytes},
            Timeout=60,
            Environment={"Variables": env},
        )


def wire_notification(lam, s3):
    bucket = settings.shop_bucket
    arn = lam.get_function(FunctionName=FUNCTION)["Configuration"]["FunctionArn"]
    try:
        lam.add_permission(
            FunctionName=FUNCTION,
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


def main():
    iam = client("iam")
    lam = client("lambda")
    s3 = client("s3")
    role_arn = ensure_role(iam)
    zip_bytes = build_zip()
    ensure_processor(lam, role_arn, zip_bytes)
    wire_notification(lam, s3)
    print("pipeline_setup OK")


if __name__ == "__main__":
    main()
