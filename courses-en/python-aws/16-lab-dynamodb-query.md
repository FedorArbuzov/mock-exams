# 16. Lab: DynamoDB query patterns

## Scenario

The shop catalog is extended with encoded keys: user orders, filtering by status. On the current environment (pk-only) we use a prefix in `pk`; in production — a composite `pk` + `sk` + Query.

**Goal:** seed data, get by pk, scan with a filter (small dataset), understand the scan anti-pattern.

---

## Step 1. Seed encoded pk items

```bash
docker exec mock-python-aws-lab python -c "
from decimal import Decimal
from shop_aws.dynamodb_repo import DynamoDBRepository

repo = DynamoDBRepository()
repo.ensure_table()
repo.put_item('USER#42#ORDER#001', {'status': 'paid', 'amount': Decimal('49.99')})
repo.put_item('USER#42#ORDER#002', {'status': 'pending', 'amount': Decimal('12.00')})
repo.put_item('USER#99#ORDER#001', {'status': 'paid', 'amount': Decimal('99.00')})
print('seed OK')
"
```

---

## Step 2. Get by exact pk

```python
from shop_aws.dynamodb_repo import DynamoDBRepository
repo = DynamoDBRepository()
print(repo.get_item("USER#42#ORDER#001"))
```

---

## Step 3. Scan + filter (lab-only pattern)

```python
from boto3.dynamodb.conditions import Attr
from shop_aws.clients import resource

table = resource("dynamodb").Table("shop-items")
resp = table.scan(FilterExpression=Attr("status").eq("pending"))
print([i["pk"] for i in resp["Items"]])
```

Ok on a small dataset — **not** for a production catalog.

---

## Step 4. Scan with a prefix on pk

```python
resp = table.scan(FilterExpression=Attr("pk").begins_with("USER#42#"))
print(resp["Items"])
```

Better: redesign the table with `pk=USER#42`, `sk=ORDER#001` + Query:

```python
# Key("pk").eq("USER#42") & Key("sk").begins_with("ORDER#")
```

---

## Step 5. Pagination exercise

```python
from shop_aws.clients import resource
table = resource("dynamodb").Table("shop-items")

items = []
resp = table.scan()
items.extend(resp.get("Items", []))
while "LastEvaluatedKey" in resp:
    resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
    items.extend(resp.get("Items", []))
print(f"total scanned: {len(items)}")
```

---

## Success criteria

- [ ] Seed ≥ 3 order items
- [ ] get_item by exact pk
- [ ] scan FilterExpression finds `pending`
- [ ] You understand why scan ≠ query at scale
- [ ] You can describe a GSI for a `status` lookup

Next: [17-dynamodb-batch-transactions](17-dynamodb-batch-transactions.md).
