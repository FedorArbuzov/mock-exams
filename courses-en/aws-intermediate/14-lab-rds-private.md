# 14. Lab: RDS + Secrets Manager

## Track A — LocalStack (simplified)

Create `aws_db_instance` with minimal parameters; connecting is optional.

## Track B — Real AWS (recommended for RDS)

See [optional-aws.md](optional-aws.md). VPC private subnets are required.

## Task 1. DB subnet group + SG

From [13-rds-private.md](13-rds-private.md).

## Task 2. Secret with connection string

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

## Task 3. Lambda in VPC (if real AWS)

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

On LocalStack VPC Lambda may not work — store metadata in DynamoDB; RDS only on track B.

## Task 4. Metadata migration

Script: dual-write DynamoDB + Postgres `images` table for reports.

## Success criteria

- [ ] RDS in a private subnet (track B)
- [ ] Secret contains host/port/password
- [ ] SG db accepts only from app-sg
- [ ] `destroy` removes RDS (skip_final_snapshot only in dev)

Next lesson: [15-ecs-fargate.md](15-ecs-fargate.md).
