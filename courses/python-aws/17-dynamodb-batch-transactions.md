# 17. DynamoDB: batch_write и transact_write

## Введение: «импорт 500 items — 500 отдельных put_item»

Migration script вызывает `put_item` в loop — медленно, throttling. **batch_write_item** — до 25 items per call. Нужна atomic «списать баланс + создать order» — **transact_write_items**.

## Что вы узнаете

- `batch_write_item` limits и unprocessed keys.
- `transact_write_items` ACID across items/tables.
- When batch vs transaction.

---

## batch_write_item

```python
ddb = client("dynamodb")
ddb.batch_write_item(
    RequestItems={
        "shop-items": [
            {"PutRequest": {"Item": {"pk": {"S": "batch:1"}, "name": {"S": "A"}}}},
            {"PutRequest": {"Item": {"pk": {"S": "batch:2"}, "name": {"S": "B"}}}},
            {"DeleteRequest": {"Key": {"pk": {"S": "old:1"}}}},
        ]
    }
)
```

| Limit | Value |
|-------|-------|
| Items per call | 25 |
| Max item size | 400 KB |
| Mixed ops | Put + Delete same table |

**UnprocessedItems** — retry with exponential backoff.

Resource wrapper:

```python
with table.batch_writer() as batch:
    for row in rows:
        batch.put_item(Item=row)
```

Auto-chunks to 25, retries unprocessed.

---

## batch_get_item

```python
resp = ddb.batch_get_item(
    RequestItems={
        "shop-items": {
            "Keys": [{"pk": {"S": "item:1"}}, {"pk": {"S": "item:2"}}],
        }
    }
)
```

Max 100 keys per call; 16 MB response size.

---

## transact_write_items

**All-or-nothing** — до 100 actions, 4 MB transaction payload:

```python
ddb.transact_write_items(
    TransactItems=[
        {
            "Put": {
                "TableName": "shop-items",
                "Item": {"pk": {"S": "order:100"}, "status": {"S": "created"}},
                "ConditionExpression": "attribute_not_exists(pk)",
            }
        },
        {
            "Update": {
                "TableName": "shop-items",
                "Key": {"pk": {"S": "account:42"}},
                "UpdateExpression": "SET balance = balance - :amt",
                "ConditionExpression": "balance >= :amt",
                "ExpressionAttributeValues": {":amt": {"N": "50"}},
            }
        },
    ]
)
```

| Failure | Effect |
|---------|--------|
| Any condition fails | entire transaction cancelled |
| `TransactionCanceledException` | inspect CancellationReasons |

Use for: inventory decrement + order create, idempotency token store.

---

## Batch vs transaction

| | batch_write | transact_write |
|--|-------------|----------------|
| Atomicity | per item | all items |
| Throughput | high | lower |
| Use case | bulk import | financial consistency |
| Idempotency | manual | condition expressions |

Связь: [18-lab-idempotent-ddb](18-lab-idempotent-ddb.md).

---

## Error handling

```python
from botocore.exceptions import ClientError

try:
    ddb.transact_write_items(TransactItems=[...])
except ClientError as e:
    if e.response["Error"]["Code"] == "TransactionCanceledException":
        reasons = e.response.get("CancellationReasons", [])
        ...
    raise
```

LocalStack 3.x поддерживает batch/transact — verify edge cases перед prod.

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| > 25 items in one batch_write | ValidationException |
| No retry on UnprocessedItems | partial import |
| transact for bulk ETL | throughput collapse |
| Float in transact Item | ValidationException |

## Резюме

**batch_write** / **batch_writer** — bulk put/delete, 25 cap, retry unprocessed. **transact_write** — multi-item ACID + conditions. Import → batch; money movement → transact.

Далее: [18-lab-idempotent-ddb](18-lab-idempotent-ddb.md).
