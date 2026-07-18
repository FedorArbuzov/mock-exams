import json
import urllib.parse

from shop_aws.dynamodb_repo import DynamoDBRepository
from shop_aws.s3_service import S3Service


def hello(event, context):
    name = (event or {}).get("name", "world")
    return {"statusCode": 200, "body": json.dumps({"message": f"Hello, {name}!"})}


def process_s3_upload(event, context):
    table = DynamoDBRepository()
    s3 = S3Service()
    processed = 0
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        size = record["s3"]["object"].get("size", 0)
        body_preview = s3.get_bytes(key)[:32]
        table.put_item(
            pk=f"file:{key}",
            data={
                "bucket": bucket,
                "key": key,
                "size": int(size),
                "preview_hex": body_preview.hex(),
            },
        )
        processed += 1
    return {"statusCode": 200, "processed": processed}
