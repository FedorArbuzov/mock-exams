# 16. Лаба: DynamoDB query patterns

## Сценарий

Shop catalog расширен encoded keys: заказы пользователей, фильтр по статусу. На текущем стенде (pk-only) используем prefix в `pk`; на production — composite `pk` + `sk` + Query.

**Цель:** seed data, get by pk, scan with filter (small dataset), понять anti-pattern scan.

---

## Шаг 1. Seed encoded pk items

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

## Шаг 2. Get by exact pk

```python
from shop_aws.dynamodb_repo import DynamoDBRepository
repo = DynamoDBRepository()
print(repo.get_item("USER#42#ORDER#001"))
```

---

## Шаг 3. Scan + filter (lab-only pattern)

```python
from boto3.dynamodb.conditions import Attr
from shop_aws.clients import resource

table = resource("dynamodb").Table("shop-items")
resp = table.scan(FilterExpression=Attr("status").eq("pending"))
print([i["pk"] for i in resp["Items"]])
```

На малом dataset ok — **не** для production catalog.

---

## Шаг 4. Scan with prefix on pk

```python
resp = table.scan(FilterExpression=Attr("pk").begins_with("USER#42#"))
print(resp["Items"])
```

Лучше: redesign table с `pk=USER#42`, `sk=ORDER#001` + Query:

```python
# Key("pk").eq("USER#42") & Key("sk").begins_with("ORDER#")
```

---

## Шаг 5. Pagination exercise

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

## Критерии приёмки

- [ ] Seed ≥ 3 order items
- [ ] get_item by exact pk
- [ ] scan FilterExpression находит `pending`
- [ ] Понимаете почему scan ≠ query at scale
- [ ] Можете описать GSI для `status` lookup

Далее: [17-dynamodb-batch-transactions](17-dynamodb-batch-transactions.md).
