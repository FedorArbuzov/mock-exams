from __future__ import annotations

from shop_aws.clients import client
from shop_aws.config import settings


class S3Service:
    def __init__(self):
        self._s3 = client("s3")
        self.bucket = settings.shop_bucket

    def ensure_bucket(self) -> None:
        try:
            self._s3.head_bucket(Bucket=self.bucket)
        except self._s3.exceptions.ClientError:
            self._s3.create_bucket(Bucket=self.bucket)

    def put_bytes(self, key: str, body: bytes, content_type: str = "application/octet-stream") -> str:
        self._s3.put_object(Bucket=self.bucket, Key=key, Body=body, ContentType=content_type)
        return key

    def get_bytes(self, key: str) -> bytes:
        return self._s3.get_object(Bucket=self.bucket, Key=key)["Body"].read()

    def list_keys(self, prefix: str = "") -> list[str]:
        resp = self._s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        return [o["Key"] for o in resp.get("Contents", [])]

    def delete(self, key: str) -> None:
        self._s3.delete_object(Bucket=self.bucket, Key=key)
