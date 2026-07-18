# Optional: лабы на реальном AWS dev-account

Некоторые темы в LocalStack **упрощены**. Для полного опыта — один раз пройдите в dev-account с **Budget alert** ($5–10).

## Подготовка

1. Создайте IAM user или SSO role с правами: VPC, EC2, ELB, RDS, ECS, IAM (ограниченно).
2. AWS Budgets → email при превышении $5.
3. `export AWS_PROFILE=course-dev`
4. В Terraform: `use_localstack = false`, уберите `endpoints`.

## Лабы, которые стоит повторить в AWS

| Урок | Зачем real AWS |
|---|---|
| 02 VPC | NAT Gateway billing, реальные route tables |
| 04 ALB | HTTPS + ACM, health checks на EC2/ECS |
| 14 RDS | Multi-AZ, реальный failover |
| 16 ECS | Fargate scheduling, Service Discovery |

## Уборка

```bash
terraform destroy -var-file=prod.tfvars
```

Проверьте в Console: нет NAT Gateway, RDS, ALB (они дорогие в простое).

## Free Tier

- RDS `db.t3.micro` — 750 ч/мес (12 мес)
- Lambda, S3, DynamoDB — в рамках free tier
- **NAT Gateway** — не free, удаляйте после лабы
