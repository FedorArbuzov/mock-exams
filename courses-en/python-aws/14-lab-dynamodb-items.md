# 14. Lab: DynamoDB put, get, delete

## Scenario

After an S3 upload, Lambda writes an index into DynamoDB. Verify CRUD through `DynamoDBRepository` — create items, read, delete, edge cases.

**Goal:** the full item lifecycle on LocalStack.

---

## Step 1. Bootstrap table

```bash
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Step 2. Put items

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

## Step 3. Get items

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.dynamodb_repo import DynamoDBRepository

repo = DynamoDBRepository()
print(repo.get_item('item:001'))
print(repo.get_item('missing'))  # None
"
```

---

## Step 4. Overwrite behavior

```python
repo.put_item("item:001", {"name": "Widget v2", "price": Decimal("11.00")})
assert repo.get_item("item:001")["name"] == "Widget v2"
```

Without a condition — silent overwrite.

---

## Step 5. Delete

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

## Step 6. S3 handler integration sim

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

Check DDB: `get_item("file:events/lab.bin")`.

---

## Success criteria

- [ ] put_item with a Decimal price
- [ ] get_item missing → None
- [ ] delete_item removes the record
- [ ] process_s3_upload creates `file:{key}`
- [ ] bootstrap + CRUD without errors

Next: [15-dynamodb-query-gsi](15-dynamodb-query-gsi.md).
