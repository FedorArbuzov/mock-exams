"""HTTP API: GET image metadata (optional X-Api-Key check)."""

from __future__ import annotations

import json
import os

import boto3

TABLE_NAME = os.environ["DYNAMODB_TABLE"]
API_SECRET_ARN = os.environ.get("API_SECRET_ARN", "")

table = boto3.resource("dynamodb").Table(TABLE_NAME)
_secrets = boto3.client("secretsmanager")
_cached_key: str | None = None


def main(event, context):
    if not _authorized(event):
        return _resp(401, {"error": "unauthorized"})

    image_id = (event.get("pathParameters") or {}).get("id")
    if not image_id:
        return _resp(400, {"error": "missing id"})

    item = table.get_item(Key={"image_id": image_id}).get("Item")
    if not item:
        return _resp(404, {"error": "not found"})
    return _resp(200, item)


def _authorized(event) -> bool:
    if not API_SECRET_ARN:
        return True
    expected = _get_api_key()
    provided = (event.get("headers") or {}).get("x-api-key") or (event.get("headers") or {}).get("X-Api-Key")
    return provided == expected


def _get_api_key() -> str:
    global _cached_key
    if _cached_key is None:
        _cached_key = _secrets.get_secret_value(SecretId=API_SECRET_ARN)["SecretString"]
    return _cached_key


def _resp(code: int, body: dict):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }
