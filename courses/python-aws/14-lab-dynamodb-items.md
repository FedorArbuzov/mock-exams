# 14. Лаба: DynamoDB put, get, delete

## Сценарий

После S3 upload Lambda пишет index в DynamoDB. Проверьте CRUD через `DynamoDBRepository` — create items, read, delete, edge cases.

**Цель:** полный цикл item lifecycle на LocalStack.

---

## Шаг 1. Bootstrap table

```bash
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Шаг 2. Put items

```bash
docker exec mock-python-aws-lab python -c "
from decimal import Decimal
from shop_aws.dynamodb_repo import DynamoDBRepository

repo = DynamoDBRepository()
repo.put_item('item:001', {'name': 'Widget', 'price': Decimal('9.99'), 'qty': 3})
repo.put_item('item:002', {'name': 'Gadget', 'price': Decimal('24.50')})
repo.put_item('file:lab/test.bin', {'bucket': 'shop-uploads', 'size': 128})
print('put OK')
"
```

---

## Шаг 3. Get items

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.dynamodb_repo import DynamoDBRepository

repo = DynamoDBRepository()
print(repo.get_item('item:001'))
print(repo.get_item('missing'))  # None
"
```

---

## Шаг 4. Overwrite behavior

```python
repo.put_item("item:001", {"name": "Widget v2", "price": Decimal("11.00")})
assert repo.get_item("item:001")["name"] == "Widget v2"
```

Без condition — silent overwrite.

---

## Шаг 5. Delete

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.dynamodb_repo import DynamoDBRepository

repo = DynamoDBRepository()
repo.delete_item('item:002')
assert repo.get_item('item:002') is None
print('delete OK')
"
```

---

## Шаг 6. S3 handler integration sim

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.lambda_handlers.handlers import process_s3_upload
from shop_aws.s3_service import S3Service

S3Service().put_bytes('events/lab.bin', b'deadbeef' * 4)
event = {'Records': [{'s3': {
    'bucket': {'name': 'shop-uploads'},
    'object': {'key': 'events/lab.bin', 'size': 32},
}}]}
print(process_s3_upload(event, None))
"
```

Проверьте DDB: `get_item("file:events/lab.bin")`.

---

## Критерии приёмки

- [ ] put_item с Decimal price
- [ ] get_item missing → None
- [ ] delete_item removes record
- [ ] process_s3_upload создаёт `file:{key}`
- [ ] bootstrap + CRUD без errors

Далее: [15-dynamodb-query-gsi](15-dynamodb-query-gsi.md).
