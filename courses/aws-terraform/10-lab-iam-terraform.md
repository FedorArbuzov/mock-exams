# 10. Лаба: IAM role для Lambda

Создайте `~/aws-labs/lesson-10` с LocalStack и provider (endpoints или `tflocal`).

## Задание 1. iam.tf

Скопируйте role + policy из [09-iam-terraform.md](09-iam-terraform.md), замените ссылки на bucket/table на заглушки или создайте bucket/table заранее.

Минимальный вариант — policy только на logs:

```hcl
resource "aws_iam_role" "lambda_exec" {
  name = "course-lab-10-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_logs" {
  name = "course-lab-10-logs"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:*"]
      Resource = "*"
    }]
  })
}
```

## Задание 2. output role ARN

```hcl
output "lambda_role_arn" {
  value = aws_iam_role.lambda_exec.arn
}
```

## Задание 3. apply и проверка

```bash
tflocal apply
tflocal output lambda_role_arn
```

CLI:

```bash
aws --endpoint-url=http://localhost:4566 iam get-role --role-name course-lab-10-lambda
```

## Критерии успеха

- [ ] Role существует
- [ ] Trust policy содержит `lambda.amazonaws.com`
- [ ] Inline policy прикреплена

Следующий урок: [11-s3-terraform.md](11-s3-terraform.md).
