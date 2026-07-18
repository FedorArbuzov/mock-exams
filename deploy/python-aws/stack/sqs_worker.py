#!/usr/bin/env python3
"""Poll shop-events with long polling."""

import json
import signal

from shop_aws.clients import client
from shop_aws.config import settings
from shop_aws.dynamodb_repo import DynamoDBRepository

running = True


def stop(*_):
    global running
    running = False


signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGTERM, stop)


def main():
    sqs = client("sqs")
    url = sqs.get_queue_url(QueueName=settings.shop_queue)["QueueUrl"]
    repo = DynamoDBRepository()
    processed = 0

    while running and processed < 10:
        resp = sqs.receive_message(
            QueueUrl=url,
            MaxNumberOfMessages=5,
            WaitTimeSeconds=5,
            VisibilityTimeout=60,
        )
        for msg in resp.get("Messages", []):
            body = json.loads(msg["Body"])
            order_id = body.get("order_id", "unknown")
            print(f"processing {order_id}")
            repo.put_item(
                pk=f"audit:{order_id}",
                data={"event": body.get("event"), "status": "processed"},
            )
            sqs.delete_message(QueueUrl=url, ReceiptHandle=msg["ReceiptHandle"])
            processed += 1
            print(f"done {order_id}")
        if not resp.get("Messages"):
            break

    print(f"processed {processed} messages")


if __name__ == "__main__":
    main()
