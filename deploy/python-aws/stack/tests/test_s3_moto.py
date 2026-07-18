import pytest
from moto import mock_aws

from shop_aws.config import settings
from shop_aws.s3_service import S3Service


@pytest.fixture
def aws_env(monkeypatch):
    monkeypatch.setattr(settings, "endpoint_url", None)
    monkeypatch.setattr(settings, "shop_bucket", "test-shop-bucket")


@mock_aws
def test_s3_put_get(aws_env):
    svc = S3Service()
    svc.ensure_bucket()
    svc.put_bytes("a.txt", b"hello")
    assert svc.get_bytes("a.txt") == b"hello"
    assert "a.txt" in svc.list_keys()
