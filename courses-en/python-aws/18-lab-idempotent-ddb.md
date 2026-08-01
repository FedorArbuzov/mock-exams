# 18. Lab: idempotent conditional put

## Scenario

A payment webhook arrives **twice** (retry). Without protection — a duplicate order in DynamoDB. Pattern: **conditional put** with an idempotency key + an optional transact for inventory.

**Goal:** implement `create_order_idempotent`, test duplicate rejection.

---

## Step 1. Conditional put — create only

```bash
docker exec mock-python-aws-lab python -c "
from decimal import Decimal
from botocore.exceptions import ClientError
from shop_aws.clients import resource

table = resource('dynamodb').Table('shop-items')

def create_once(pk, data):
    try:
        table.put_item(
            Item={'pk': pk, **data},
            ConditionExpression='attribute_not_exists(pk)',
        )
        return 'created'
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return 'duplicate'
        raise

token = 'idem-abc-123'
r1 = create_once(f'IDEM#{token}', {'order_id': 'ord-1', 'amount': Decimal('50')})
r2 = create_once(f'IDEM#{token}', {'order_id': 'ord-1', 'amount': Decimal('50')})
print(r1, r2)  # created duplicate
"
```

---

## Step 2. Idempotent order service

```python
from decimal import Decimal
from botocore.exceptions import ClientError
from shop_aws.clients import resource

table = resource("dynamodb").Table("shop-items")

class OrderWriter:
    def create_order(self, idempotency_key: str, order_id: str, amount: Decimal) -> str:
        pk = f"IDEM#{idempotency_key}"
        try:
            table.put_item(
                Item={"pk": pk, "order_id": order_id, "amount": amount, "status": "created"},
                ConditionExpression="attribute_not_exists(pk)",
            )
            table.put_item(
                Item={
                    "pk": f"ORDER#{order_id}",
                    "amount": amount,
                    "status": "created",
                    "idempotency_key": idempotency_key,
                },
            )
            return "created"
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                existing = table.get_item(Key={"pk": pk}).get("Item")
                return f"duplicate:{existing.get('order_id')}"
            raise

w = OrderWriter()
print(w.create_order("key-1", "ord-100", Decimal("29.99")))
print(w.create_order("key-1", "ord-100", Decimal("29.99")))
```

**Note:** in production, wrap both puts in a **transact_write** — atomic.

---

## Step 3. Transact version (exercise)

```python
from shop_aws.clients import client
from decimal import Decimal

def create_order_transact(idem_key: str, order_id: str, amount: Decimal):
    ddb = client("dynamodb")
    try:
        ddb.transact_write_items(TransactItems=[
            {
                "Put": {
                    "TableName": "shop-items",
                    "Item": {"pk": {"S": f"IDEM#{idem_key}"}, "order_id": {"S": order_id}},
                    "ConditionExpression": "attribute_not_exists(pk)",
                }
            },
            {
                "Put": {
                    "TableName": "shop-items",
                    "Item": {
                        "pk": {"S": f"ORDER#{order_id}"},
                        "amount": {"N": str(amount)},
                        "status": {"S": "created"},
                    },
                }
            },
        ])
        return "created"
    except ClientError as e:
        if e.response["Error"]["Code"] == "TransactionCanceledException":
            return "duplicate"
        raise
```

---

## Step 4. Link to SQS retries

Duplicate SQS messages ([`SQSService`](../../deploy/python-aws/stack/shop_aws/sqs_service.py)) — the same idempotency key from the message body. S3 events — at-least-once delivery ([11-s3-events-notifications](11-s3-events-notifications.md)).

---

## Success criteria

- [ ] Conditional put: the second call → handled duplicate
- [ ] Idempotency pk `IDEM#{key}` separated from the business pk
- [ ] (Optional) transact_write atomic version
- [ ] You understand the link to S3/SQS at-least-once

## Summary

Conditional put and transact_write — protection against duplicate webhook/SQS delivery. Block 01–18: boto3 → S3 → DynamoDB on the [`deploy/python-aws`](../../deploy/python-aws/README.md) environment.

Next: [19-lambda-handler-basics](19-lambda-handler-basics.md).
