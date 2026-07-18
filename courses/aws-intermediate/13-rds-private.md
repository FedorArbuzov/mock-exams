# 13. RDS в private subnet

## Паттерн

```text
Lambda/ECS (private subnet + NAT)
    → security group app
    → RDS Postgres (private subnet, sg-db)
```

RDS **не** получает публичный IP в production.

## Terraform sketch

```hcl
resource "aws_db_subnet_group" "app" {
  name       = "${var.project}-db"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "db" {
  name   = "${var.project}-db-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}

resource "aws_db_instance" "app" {
  identifier             = "${var.project}-postgres"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "app"
  username               = "app"
  password               = random_password.db.result
  db_subnet_group_name   = aws_db_subnet_group.app.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  skip_final_snapshot    = true   # только dev!
}
```

Пароль — из `random_password` + Secrets Manager (урок 12).

## Multi-AZ

`multi_az = true` — standby в другой AZ, автоматический failover. Дороже, для prod.

## Read Replica

Асинхронная реплика для чтения, не для failover (в отличие от Multi-AZ standby).

## LocalStack vs AWS

LocalStack RDS — упрощённый. **Полная лаба** — [optional-aws.md](optional-aws.md) с `db.t3.micro`.

## Чек-лист

- Зачем `db_subnet_group`?
- Почему `publicly_accessible = false`?
- Как app в private subnet ходит в интернет (NAT)?
- Multi-AZ vs Read Replica?

Следующий урок: [14-lab-rds-private.md](14-lab-rds-private.md).
