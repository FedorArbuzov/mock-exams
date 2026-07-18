# 14. Лаба: RDS + Secrets Manager

## Трек A — LocalStack (упрощённый)

Создайте `aws_db_instance` с минимальными параметрами; подключение опционально.

## Трек B — Real AWS (рекомендуется для RDS)

См. [optional-aws.md](optional-aws.md). VPC private subnets обязательны.

## Задание 1. DB subnet group + SG

Из [13-rds-private.md](13-rds-private.md).

## Задание 2. Secret с connection string

```hcl
resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    host     = aws_db_instance.app.address
    port     = aws_db_instance.app.port
    dbname   = aws_db_instance.app.db_name
    username = aws_db_instance.app.username
    password = random_password.db.result
  })
}
```

## Задание 3. Lambda в VPC (если real AWS)

```hcl
resource "aws_lambda_function" "api" {
  # ...
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.app.id]
  }
}
```

+ IAM `ec2:CreateNetworkInterface` (VPC access execution role).

На LocalStack VPC Lambda может не работать — храните metadata в DynamoDB, RDS только в треке B.

## Задание 4. Миграция metadata

Скрипт: dual-write DynamoDB + Postgres `images` table для отчётов.

## Критерии успеха

- [ ] RDS в private subnet (трек B)
- [ ] Secret содержит host/port/password
- [ ] SG db принимает только от app-sg
- [ ] `destroy` удаляет RDS (skip_final_snapshot только dev)

Следующий урок: [15-ecs-fargate.md](15-ecs-fargate.md).
