import boto3

from shop_aws.config import settings


def boto_session() -> boto3.Session:
    return boto3.Session(
        aws_access_key_id=settings.access_key,
        aws_secret_access_key=settings.secret_key,
        region_name=settings.region,
    )


def client(service: str):
    kwargs = {}
    if settings.endpoint_url:
        kwargs["endpoint_url"] = settings.endpoint_url
    return boto_session().client(service, **kwargs)


def resource(service: str):
    kwargs = {}
    if settings.endpoint_url:
        kwargs["endpoint_url"] = settings.endpoint_url
    return boto_session().resource(service, **kwargs)
