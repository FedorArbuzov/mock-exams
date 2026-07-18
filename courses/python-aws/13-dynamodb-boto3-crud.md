# 13. DynamoDB boto3: table item CRUD

## Введение: «PostgreSQL привычнее — зачем DynamoDB в shop?»

Order metadata, file index, session cache — **key-value access**, millions RPS, pay-per-request. RDS overkill; DynamoDB fits **single-digit ms get by key**. Lambda handler [`process_s3_upload`](../../deploy/python-aws/stack/shop_aws/lambda_handlers/handlers.py) пишет index после S3 upload.

Эталон: [`DynamoDBRepository`](../../deploy/python-aws/stack/shop_aws/dynamodb_repo.py).

## Что вы узнаете

- Table create (labs) vs IaC (prod).
- `put_item`, `get_item`, `delete_item` через resource API.
- Types: String, Number, **Decimal**, nested Map/List.

---

## Data model (стенд)

```text
Table: shop-items
  PK: pk (String)  — единственный key
  Attributes: произвольные (schemaless per item)
```

Пример item:

```json
{"pk": "file:lab/photo.jpg", "bucket": "shop-uploads", "size": 1024}
```

Single-table design с composite keys — [15-dynamodb-query-gsi](15-dynamodb-query-gsi.md).

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

**Overwrite:** same pk → full replace без condition.

---

## get_item

```python
resp = self._table.get_item(Key={"pk": pk})
item = resp.get("Item")  # None if missing
```

| Param | Default |
|-------|---------|
| `ConsistentRead` | False (eventually consistent) |
| `ProjectionExpression` | subset attributes |

Strongly consistent — 2× RCU cost.

---

## delete_item

```python
self._table.delete_item(Key={"pk": pk})
```

Idempotent — delete missing ok.

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

**Float запрещён** — используйте `Decimal`:

```python
from decimal import Decimal
item = {"price": Decimal("19.99")}
```

---

## Client vs resource в repo

| Operation | API level |
|-----------|-----------|
| `create_table`, `list_tables` | client |
| `put_item`, `get_item` | resource.Table |

client `put_item` требует typed dict `{"S": "..."}` — verbose; resource проще.

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| float in Item | TypeError |
| Wrong key name | ValidationException |
| get_item без check None | KeyError downstream |
| create_table in request path | slow + race |

## Резюме

DynamoDB CRUD: **put/get/delete** by partition key. Resource API — Python types. Labs bootstrap table; prod — Terraform. Decimal для денег/numbers.

Далее: [14-lab-dynamodb-items](14-lab-dynamodb-items.md).
