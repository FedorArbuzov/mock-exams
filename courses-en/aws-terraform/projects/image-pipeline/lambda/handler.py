"""Invoke: write a file to S3."""

from __future__ import annotations

import json
import os
import uuid

import boto3

BUCKET = os.environ["BUCKET_NAME"]
s3 = boto3.client("s3")


def main(event, context):
    event = event or {}
    file_id = event.get("file_id") or str(uuid.uuid4())
    filename = event.get("filename") or f"{file_id}.txt"
    body = event.get("body") or f"hello from lambda {file_id}\n"
    if isinstance(body, str):
        body = body.encode("utf-8")
    key = f"files/{filename}"

    s3.put_object(Bucket=BUCKET, Key=key, Body=body)
    return {
        "statusCode": 200,
        "body": json.dumps({"ok": True, "s3_key": key}),
    }
