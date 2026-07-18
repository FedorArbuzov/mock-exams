#!/usr/bin/env python3
"""Create SNS topic and subscribe shop-events SQS queue."""

import json

from shop_aws.clients import client
from shop_aws.config import settings

sns = client("sns")
sqs = client("sqs")

topic_arn = sns.create_topic(Name="shop-notifications")["TopicArn"]
queue_url = sqs.get_queue_url(QueueName=settings.shop_queue)["QueueUrl"]
queue_arn = sqs.get_queue_attributes(
    QueueUrl=queue_url, AttributeNames=["QueueArn"]
)["Attributes"]["QueueArn"]

policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "sns.amazonaws.com"},
        "Action": "sqs:SendMessage",
        "Resource": queue_arn,
        "Condition": {"ArnEquals": {"aws:SourceArn": topic_arn}},
    }],
}
sqs.set_queue_attributes(
    QueueUrl=queue_url,
    Attributes={"Policy": json.dumps(policy)},
)

sub = sns.subscribe(TopicArn=topic_arn, Protocol="sqs", Endpoint=queue_arn)
print("topic", topic_arn)
print("sub", sub["SubscriptionArn"])
