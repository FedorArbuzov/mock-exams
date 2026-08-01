# 15. DynamoDB in Terraform

## Table

```hcl
resource "aws_dynamodb_table" "images" {
  name         = "${var.project}-images"
  billing_mode = "PAY_PER_REQUEST"   # on-demand; simpler for labs
  hash_key     = "image_id"

  attribute {
    name = "image_id"
    type = "S"
  }

  tags = var.tags
}
```

## Keys

| Type | Fields | Example |
|---|---|---|
| Partition only | `hash_key` | `image_id` |
| Composite | `hash_key` + `range_key` | `user_id` + `created_at` |

GSI — the `global_secondary_index` block (beyond the basic course).

## TTL (optional)

```hcl
ttl {
  attribute_name = "expires_at"
  enabled        = true
}
```

## Reading from Lambda (boto3)

```python
table.put_item(Item={
    "image_id": {"S": image_id},
    "s3_key": {"S": key},
    "thumb_key": {"S": thumb_key},
})
```

With `boto3.resource` — no `{"S": ...}` types.

## Terraform is not for data

Item records are usually created by the application/Lambda, not Terraform. The exception is `aws_dynamodb_table_item` for seeding in dev.

## Checklist

- How does `PAY_PER_REQUEST` differ from provisioned capacity?
- What is a `hash_key`?
- Why aren't items in Terraform in production?

Next lesson: [16-lab-dynamodb-terraform.md](16-lab-dynamodb-terraform.md).
