#!/usr/bin/env python3
"""Bootstrap LocalStack resources for python-aws labs."""

from shop_aws.dynamodb_repo import DynamoDBRepository
from shop_aws.s3_service import S3Service
from shop_aws.sqs_service import SQSService


def main() -> None:
    S3Service().ensure_bucket()
    DynamoDBRepository().ensure_table()
    _ = SQSService().queue_url
    print("bootstrap OK: bucket, table, queue ready")


if __name__ == "__main__":
    main()
