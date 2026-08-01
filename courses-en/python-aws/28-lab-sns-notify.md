# 28. Lab: SNS notify pipeline

## Scenario

On `order.paid` the shop publishes to an SNS topic. The SQS subscriber `shop-events` receives the notification; the worker parses the wrapped message and writes `notify:{order_id}` to DynamoDB.

**Goal:** topic + subscription + publish + consume of a single event end-to-end.

---

## Step 1. Create topic

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
sns = client('sns')
arn = sns.create_topic(Name='shop-notifications')['TopicArn']
print(arn)
"
```

Save the `TOPIC_ARN` for the next steps.

---

## Step 2. Queue ARN + policy

```python
# sns_setup.py
import json
from shop_aws.clients import client
from shop_aws.config import settings

sns = client("sns")
sqs = client("sqs")

topic_arn = sns.create_topic(Name="shop-notifications")["TopicArn"]
queue_url = sqs.get_queue_url(QueueName=settings.shop_queue)["QueueUrl"]
# extract account/queue from URL or get_queue_attributes
attrs = sqs.get_queue_attributes(QueueUrl=queue_url, AttributeNames=["QueueArn"])
queue_arn = attrs["Attributes"]["QueueArn"]

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
```

```bash
docker exec mock-python-aws-lab python sns_setup.py
```

---

## Step 3. Publish order.paid

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.clients import client

sns = client('sns')
topic = sns.create_topic(Name='shop-notifications')['TopicArn']
sns.publish(
    TopicArn=topic,
    Message=json.dumps({'event': 'order.paid', 'order_id': 'ord-sns-1', 'amount': 99.0}),
)
print('published')
"
```

---

## Step 4. Consume from SQS

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.clients import client
from shop_aws.config import settings
from shop_aws.dynamodb_repo import DynamoDBRepository

sqs = client('sqs')
url = sqs.get_queue_url(QueueName=settings.shop_queue)['QueueUrl']
resp = sqs.receive_message(QueueUrl=url, WaitTimeSeconds=5, MaxNumberOfMessages=1)
msgs = resp.get('Messages', [])
if not msgs:
    raise SystemExit('no message')
raw = json.loads(msgs[0]['Body'])
inner = json.loads(raw['Message'])
print('inner', inner)
repo = DynamoDBRepository()
repo.put_item(pk=f\"notify:{inner['order_id']}\", data={'event': inner['event'], 'source': 'sns'})
sqs.delete_message(QueueUrl=url, ReceiptHandle=msgs[0]['ReceiptHandle'])
print('stored', repo.get_item(f\"notify:{inner['order_id']}\"))
"
```

---

## Step 5. Second subscriber (exercise)

Create a `shop-analytics` queue, subscribe it to the same topic, publish once — **both** queues should receive a copy (fan-out).

---

## Step 6. Unsubscribe cleanup

```python
sns.unsubscribe(SubscriptionArn=sub_arn)
```

---

## Success criteria

- [ ] Topic `shop-notifications` created
- [ ] SQS policy allows SNS
- [ ] publish → message in shop-events
- [ ] Parsed inner JSON + DDB row `notify:ord-sns-1`
- [ ] (Optional) second queue fan-out

## Summary

SNS lab: **policy → subscribe → publish → parse wrapped Message**. Fan-out without changing the publisher. Next EventBridge for routing rules.

Next: [29-eventbridge-boto3](29-eventbridge-boto3.md).
