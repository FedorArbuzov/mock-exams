from __future__ import annotations

import json

from shop_aws.clients import client
from shop_aws.config import settings


class SQSService:
    def __init__(self):
        self._sqs = client("sqs")
        self.queue_name = settings.shop_queue
        self._queue_url: str | None = None

    @property
    def queue_url(self) -> str:
        if self._queue_url:
            return self._queue_url
        try:
            self._queue_url = self._sqs.get_queue_url(QueueName=self.queue_name)["QueueUrl"]
        except self._sqs.exceptions.QueueDoesNotExist:
            resp = self._sqs.create_queue(QueueName=self.queue_name)
            self._queue_url = resp["QueueUrl"]
        return self._queue_url

    def send(self, payload: dict) -> str:
        resp = self._sqs.send_message(QueueUrl=self.queue_url, MessageBody=json.dumps(payload))
        return resp["MessageId"]

    def receive_one(self, wait_seconds: int = 1) -> dict | None:
        resp = self._sqs.receive_message(
            QueueUrl=self.queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=wait_seconds,
        )
        messages = resp.get("Messages", [])
        if not messages:
            return None
        msg = messages[0]
        self._sqs.delete_message(QueueUrl=self.queue_url, ReceiptHandle=msg["ReceiptHandle"])
        return json.loads(msg["Body"])
