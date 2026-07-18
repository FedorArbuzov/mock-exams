#!/usr/bin/env python3
"""EventBridge rule shop-file-uploaded -> shop-events SQS."""

import json

from shop_aws.clients import client
from shop_aws.config import settings

events = client("events")
sqs = client("sqs")

queue_url = sqs.get_queue_url(QueueName=settings.shop_queue)["QueueUrl"]
queue_arn = sqs.get_queue_attributes(
    QueueUrl=queue_url, AttributeNames=["QueueArn"]
)["Attributes"]["QueueArn"]

rule_name = "shop-file-uploaded"
events.put_rule(
    Name=rule_name,
    EventPattern=json.dumps({
        "source": ["shop.files"],
        "detail-type": ["File Uploaded"],
    }),
    State="ENABLED",
)

policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "events.amazonaws.com"},
        "Action": "sqs:SendMessage",
        "Resource": queue_arn,
    }],
}
sqs.set_queue_attributes(QueueUrl=queue_url, Attributes={"Policy": json.dumps(policy)})

events.put_targets(
    Rule=rule_name,
    Targets=[{"Id": "shop-events-target", "Arn": queue_arn}],
)
print("eventbridge_setup OK")
