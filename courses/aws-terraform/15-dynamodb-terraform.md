# 15. DynamoDB в Terraform

## Table

```hcl
resource "aws_dynamodb_table" "images" {
  name         = "${var.project}-images"
  billing_mode = "PAY_PER_REQUEST"   # on-demand; для лаб — проще
  hash_key     = "image_id"

  attribute {
    name = "image_id"
    type = "S"
  }

  tags = var.tags
}
```

## Ключи

| Тип | Поля | Пример |
|---|---|---|
| Partition only | `hash_key` | `image_id` |
| Composite | `hash_key` + `range_key` | `user_id` + `created_at` |

GSI — `global_secondary_index` блок (вне базового курса).

## TTL (опционально)

```hcl
ttl {
  attribute_name = "expires_at"
  enabled        = true
}
```

## Чтение из Lambda (boto3)

```python
table.put_item(Item={
    "image_id": {"S": image_id},
    "s3_key": {"S": key},
    "thumb_key": {"S": thumb_key},
})
```

С `boto3.resource` — без типов `{"S": ...}`.

## Terraform не для данных

Записи items обычно создаёт приложение/Lambda, не Terraform. Исключение — `aws_dynamodb_table_item` для seed в dev.

## Чек-лист

- Чем `PAY_PER_REQUEST` отличается от provisioned capacity?
- Что такое `hash_key`?
- Почему items не в Terraform в production?

Следующий урок: [16-lab-dynamodb-terraform.md](16-lab-dynamodb-terraform.md).
