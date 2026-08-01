"""SQS worker: process S3 upload events, resize, store metadata."""

from __future__ import annotations

import io
import json
import os
import urllib.parse
import uuid

import boto3

try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore

THUMB_MAX_WIDTH = 800
THUMB_PREFIX = os.environ.get("THUMB_PREFIX", "thumbs/")
TABLE_NAME = os.environ["DYNAMODB_TABLE"]

s3 = boto3.client("s3")
table = boto3.resource("dynamodb").Table(TABLE_NAME)


def main(event, context):
    for record in event.get("Records", []):
        for bucket, key in _iter_s3_objects(record):
            try:
                process_object(bucket, key)
            except Exception as exc:
                print(f"ERROR processing s3://{bucket}/{key}: {exc}")
                raise
    return {"statusCode": 200}


def _iter_s3_objects(record):
    if record.get("eventSource") == "aws:sqs":
        body = json.loads(record["body"])
        events = body.get("Records", [body])
        for ev in events:
            if "s3" in ev:
                b = ev["s3"]["bucket"]["name"]
                k = urllib.parse.unquote_plus(ev["s3"]["object"]["key"])
                yield b, k
    elif "s3" in record:
        b = record["s3"]["bucket"]["name"]
        k = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        yield b, k


def process_object(bucket: str, key: str) -> None:
    image_id = str(uuid.uuid4())
    body = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    thumb_key = f"{THUMB_PREFIX}{image_id}.jpg"
    width, height = resize_and_upload(bucket, thumb_key, body)
    table.put_item(
        Item={
            "image_id": image_id,
            "source_bucket": bucket,
            "s3_key": key,
            "thumb_key": thumb_key,
            "width": width,
            "height": height,
        }
    )


def resize_and_upload(bucket: str, thumb_key: str, body: bytes) -> tuple[int, int]:
    if Image is None:
        s3.put_object(Bucket=bucket, Key=thumb_key, Body=body, ContentType="image/jpeg")
        return 0, 0

    img = Image.open(io.BytesIO(body)).convert("RGB")
    width, height = img.size
    if width > THUMB_MAX_WIDTH:
        ratio = THUMB_MAX_WIDTH / width
        img = img.resize((THUMB_MAX_WIDTH, int(height * ratio)), Image.Resampling.LANCZOS)
        width, height = img.size
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    buf.seek(0)
    s3.put_object(Bucket=bucket, Key=thumb_key, Body=buf.getvalue(), ContentType="image/jpeg")
    return width, height
