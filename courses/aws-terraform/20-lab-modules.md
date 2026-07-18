# 20. Лаба: модуль S3 bucket

## Задание 1. modules/s3-bucket/

`variables.tf`:

```hcl
variable "bucket_name" { type = string }
variable "tags" {
  type    = map(string)
  default = {}
}
```

`main.tf` — bucket + public_access_block + encryption (из урока 11).

`outputs.tf`:

```hcl
output "bucket_id" { value = aws_s3_bucket.this.id }
output "bucket_arn" { value = aws_s3_bucket.this.arn }
```

## Задание 2. root main.tf

```hcl
module "images" {
  source      = "./modules/s3-bucket"
  bucket_name = var.bucket_name
  tags        = local.common_tags
}
```

Замените прямые `aws_s3_bucket` в lesson-18 на module.

## Задание 3. plan

```bash
tflocal plan
```

**Ожидание:** replace или move — при смене адреса ресурса в state может понадобиться `terraform state mv` (продвинутый шаг; для лаб проще новый каталог).

## Критерии успеха

- [ ] Module применяется без ошибок
- [ ] Outputs root отдают bucket_arn из module

Следующий урок: [21-ci-terraform.md](21-ci-terraform.md).
