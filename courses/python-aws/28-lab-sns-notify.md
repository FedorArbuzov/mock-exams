# 28. Лаба: SNS notify pipeline

## Сценарий

При `order.paid` shop публикует в SNS topic. Подписчик SQS `shop-events` получает notification; worker парсит wrapped message и пишет `notify:{order_id}` в DynamoDB.

**Цель:** topic + subscription + publish + consume одного события end-to-end.

---

## Шаг 1. Create topic

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
sns = client('sns')
arn = sns.create_topic(Name='shop-notifications')['TopicArn']
print(arn)
"
```

Сохраните `TOPIC_ARN` для следующих шагов.

---

## Шаг 2. Queue ARN + policy

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

## Шаг 3. Publish order.paid

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

## Шаг 4. Consume from SQS

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

## Шаг 5. Second subscriber (exercise)

Создайте queue `shop-analytics`, subscribe на тот же topic, publish once — **обе** очереди должны получить копию (fan-out).

---

## Шаг 6. Unsubscribe cleanup

```python
sns.unsubscribe(SubscriptionArn=sub_arn)
```

---

## Критерии приёмки

- [ ] Topic `shop-notifications` создан
- [ ] SQS policy allows SNS
- [ ] publish → message in shop-events
- [ ] Parsed inner JSON + DDB row `notify:ord-sns-1`
- [ ] (Optional) second queue fan-out

## Резюме

SNS lab: **policy → subscribe → publish → parse wrapped Message**. Fan-out без изменения publisher. Далее EventBridge для routing rules.

Далее: [29-eventbridge-boto3](29-eventbridge-boto3.md).
