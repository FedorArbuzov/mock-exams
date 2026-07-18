# 30. Лаба: event pipeline S3 → EventBridge → SQS

## Сценарий

Вместо прямого S3→Lambda используем **EventBridge rule**: custom event `File Uploaded` (симуляция post-processing) или S3 integration — target **shop-events** SQS. Worker обрабатывает как в [26-lab-sqs-worker](26-lab-sqs-worker.md).

**Цель:** rule + target + put_events + worker consume; опционально связать с S3 upload.

---

## Шаг 1. Bootstrap

```bash
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Шаг 2. Rule + SQS target

```python
# eventbridge_setup.py
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
print("rule OK")
```

```bash
docker exec mock-python-aws-lab python eventbridge_setup.py
```

---

## Шаг 3. Publish File Uploaded event

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.clients import client
from shop_aws.s3_service import S3Service

key = S3Service().put_bytes('uploads/eb-lab.bin', b'eventbridge-lab')
events = client('events')
resp = events.put_events(Entries=[{
    'Source': 'shop.files',
    'DetailType': 'File Uploaded',
    'Detail': json.dumps({'bucket': 'shop-uploads', 'key': key, 'size': 16}),
}])
print('failed', resp['FailedEntryCount'])
"
```

---

## Шаг 4. Worker consume EventBridge → SQS payload

EventBridge to SQS body — JSON event (not SNS wrap):

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.clients import client
from shop_aws.config import settings
from shop_aws.dynamodb_repo import DynamoDBRepository

sqs = client('sqs')
url = sqs.get_queue_url(QueueName=settings.shop_queue)['QueueUrl']
resp = sqs.receive_message(QueueUrl=url, WaitTimeSeconds=10, MaxNumberOfMessages=1)
msg = resp.get('Messages', [{}])[0]
if not msg.get('Body'):
    raise SystemExit('no msg')
body = json.loads(msg['Body'])
detail = json.loads(body['detail']) if isinstance(body.get('detail'), str) else body.get('detail', body)
key = detail.get('key', 'unknown')
DynamoDBRepository().put_item(pk=f'eb:{key}', data={'source': body.get('source'), 'detail_type': body.get('detail-type')})
sqs.delete_message(QueueUrl=url, ReceiptHandle=msg['ReceiptHandle'])
print('stored eb:' + key)
"
```

Note: exact SQS envelope varies LocalStack vs AWS — inspect `msg['Body']` first.

---

## Шаг 5. Alternative — S3 direct pipeline

Compare with [24-lab-s3-lambda-pipeline](24-lab-s3-lambda-pipeline.md):

| Path | Pros |
|------|------|
| S3 → Lambda | fewer moving parts |
| S3 → EventBridge → SQS | central routing |

Document when you'd pick each in README notes (local).

---

## Шаг 6. Negative pattern test

Publish wrong source:

```python
events.put_events(Entries=[{
    "Source": "other.app",
    "DetailType": "File Uploaded",
    "Detail": "{}",
}])
```

Queue **не** должна получить (rule filter).

---

## Критерии приёмки

- [ ] Rule `shop-file-uploaded` enabled
- [ ] SQS policy for EventBridge
- [ ] put_events → message in queue
- [ ] Worker stores `eb:{key}` in DynamoDB
- [ ] Wrong source not delivered

## Резюме

EventBridge lab: **rule pattern → SQS target → put_events → worker**. Inspect envelope на LocalStack. Secrets для Lambda — следующий блок.

Далее: [31-secrets-ssm](31-secrets-ssm.md).
