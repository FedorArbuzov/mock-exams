# 13. RDS in a private subnet

## Pattern

```text
Lambda/ECS (private subnet + NAT)
    → security group app
    → RDS Postgres (private subnet, sg-db)
```

RDS does **not** get a public IP in production.

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
  skip_final_snapshot    = true   # dev only!
}
```

Password — from `random_password` + Secrets Manager (lesson 12).

## Multi-AZ

`multi_az = true` — standby in another AZ, automatic failover. More expensive, for prod.

## Read Replica

Async replica for reads, not for failover (unlike Multi-AZ standby).

## LocalStack vs AWS

LocalStack RDS is simplified. **Full lab** — [optional-aws.md](optional-aws.md) with `db.t3.micro`.

## Checklist

- Why `db_subnet_group`?
- Why `publicly_accessible = false`?
- How does an app in a private subnet reach the internet (NAT)?
- Multi-AZ vs Read Replica?

Next lesson: [14-lab-rds-private.md](14-lab-rds-private.md).
