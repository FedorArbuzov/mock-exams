# 12. Лаба: S3 bucket и объект

## Задание 1. s3.tf

Реализуйте bucket с encryption и public access block из [11-s3-terraform.md](11-s3-terraform.md).

`bucket_name` через variable.

## Задание 2. Загрузить тестовый объект через Terraform

`upload.tf`:

```hcl
resource "aws_s3_object" "sample" {
  bucket = aws_s3_bucket.images.id
  key    = "uploads/sample.jpg"
  source = "${path.module}/fixtures/sample.jpg"
}
```

Создайте `fixtures/sample.jpg` — любой маленький JPEG (или PNG, смените suffix в notification позже).

## Задание 3. apply

```bash
tflocal apply
aws --endpoint-url=http://localhost:4566 s3 ls s3://YOUR_BUCKET/uploads/
```

## Задание 4. Версионирование

Включите `aws_s3_bucket_versioning`. Залейте объект с тем же key повторно — проверьте версии (в LocalStack поддержка может быть упрощена).

## Критерии успеха

- [ ] Bucket с encryption и block public
- [ ] Объект `uploads/sample.jpg` доступен через CLI
- [ ] `terraform destroy` очищает bucket (пустой bucket перед destroy)

Следующий урок: [13-lambda-terraform.md](13-lambda-terraform.md).
