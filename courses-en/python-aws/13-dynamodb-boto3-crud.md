# 13. DynamoDB boto3: table item CRUD

## Intro: "PostgreSQL is more familiar — why DynamoDB in shop?"

Order metadata, file index, session cache — **key-value access**, millions of RPS, pay-per-request. RDS is overkill; DynamoDB fits **single-digit ms get by key**. The Lambda handler [`process_s3_upload`](../../deploy/python-aws/stack/shop_aws/lambda_handlers/handlers.py) writes an index after an S3 upload.

Reference: [`DynamoDBRepository`](../../deploy/python-aws/stack/shop_aws/dynamodb_repo.py).

## What you'll learn

- Table create (labs) vs IaC (prod).
- `put_item`, `get_item`, `delete_item` via the resource API.
- Types: String, Number, **Decimal**, nested Map/List.

---

## Data model (environment)

```text
Table: shop-items
  PK: pk (String)  — the only key
  Attributes: arbitrary (schemaless per item)
```

Example item:

```json
{"pk": "file:lab/photo.jpg", "bucket": "shop-uploads", "size": 1024}
```

Single-table design with composite keys — [15-dynamodb-query-gsi](15-dynamodb-query-gsi.md).

---

## ensure_table (client)

```python
self._ddb.create_table(
    TableName=self.table_name,
    KeySchema=[{"AttributeName": "pk", "KeyType": "HASH"}],
    AttributeDefinitions=[{"AttributeName": "pk", "AttributeType": "S"}],
    BillingMode="PAY_PER_REQUEST",
)
waiter = self._ddb.get_waiter("table_exists")
waiter.wait(TableName=self.table_name)
```

| BillingMode | When |
|-------------|------|
| `PAY_PER_REQUEST` | labs, spiky traffic |
| `PROVISIONED` | predictable load |

---

## put_item (resource)

```python
self._table.put_item(Item={"pk": pk, **data})
```

| Option | Effect |
|--------|--------|
| `ConditionExpression` | create-only / optimistic lock |
| `Item` entire replace | no partial update (use UpdateItem) |

**Overwrite:** same pk → full replace without a condition.

---

## get_item

```python
resp = self._table.get_item(Key={"pk": pk})
item = resp.get("Item")  # None if missing
```

| Param | Default |
|-------|---------|
| `ConsistentRead` | False (eventually consistent) |
| `ProjectionExpression` | subset of attributes |

Strongly consistent — 2× RCU cost.

---

## delete_item

```python
self._table.delete_item(Key={"pk": pk})
```

Idempotent — deleting a missing item is ok.

---

## Type system

| Python | DynamoDB |
|--------|----------|
| `str` | S |
| `int` / `Decimal` | N |
| `bool` | BOOL |
| `dict` | M |
| `list` | L |
| `bytes` | B |

**Float is forbidden** — use `Decimal`:

```python
from decimal import Decimal
item = {"price": Decimal("19.99")}
```

---

## Client vs resource in the repo

| Operation | API level |
|-----------|-----------|
| `create_table`, `list_tables` | client |
| `put_item`, `get_item` | resource.Table |

client `put_item` requires a typed dict `{"S": "..."}` — verbose; resource is simpler.

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| float in Item | TypeError |
| Wrong key name | ValidationException |
| get_item without a None check | KeyError downstream |
| create_table in the request path | slow + race |

## Summary

DynamoDB CRUD: **put/get/delete** by partition key. Resource API — Python types. Labs bootstrap the table; prod — Terraform. Decimal for money/numbers.

Next: [14-lab-dynamodb-items](14-lab-dynamodb-items.md).
