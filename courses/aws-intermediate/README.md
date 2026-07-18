# AWS Intermediate

Средний уровень AWS. Подразумевается прохождение [`aws-basic`](../aws-basic/README.md) и [`aws-terraform`](../aws-terraform/README.md): вы понимаете сервисы и уже собирали pipeline S3 → Lambda → DynamoDB в Terraform.

**Цель:** из «знаю serverless» — в «проектирую production-ready платформу»: сеть, API, очереди, секреты, наблюдаемость, multi-env IaC.

## Для кого

- Выпускники `aws-terraform`, готовые углубиться.
- DevOps / backend после Kubernetes-курсов (сравнения с Ingress, RBAC, очередями).
- Подготовка к **Solutions Architect Associate** (практические паттерны).

## Требования

| Инструмент | Назначение |
|---|---|
| Docker | LocalStack |
| Terraform ≥ 1.5 | все лабы |
| `tflocal` или endpoints | локальный AWS |
| AWS CLI v2 | проверка ресурсов |
| Python 3 | Lambda handlers |

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
pip install terraform-local
```

**RAM:** LocalStack с Lambda + (опционально) ECS — от 4 ГБ Docker.

## LocalStack vs реальный AWS

| Блок | LocalStack | Real AWS (optional) |
|---|---|---|
| S3, Lambda, DynamoDB, SQS, API GW, EventBridge | ✅ основной трек | smoke-test |
| Secrets Manager, KMS, CloudWatch | ✅ | ✅ |
| VPC, ALB, RDS, ECS | ⚠️ упрощённо | лабы 02, 04, 14, 16 — [optional-aws.md](optional-aws.md) |

## Программа

### Сеть

1. [Custom VPC: subnets, routing](01-vpc-custom.md)
2. [Лаба: VPC в Terraform](02-lab-vpc-custom.md)
3. [Security Groups и ALB](03-alb-security-groups.md)
4. [Лаба: ALB + targets](04-lab-alb-security-groups.md)

### API и события

5. [API Gateway HTTP API](05-api-gateway.md)
6. [Лаба: REST API → Lambda](06-lab-api-gateway.md)
7. [SQS, DLQ, backpressure](07-sqs-dlq.md)
8. [Лаба: S3 → SQS → Lambda](08-lab-sqs-dlq.md)
9. [EventBridge: rules и bus](09-eventbridge.md)
10. [Лаба: EventBridge вместо прямого S3](10-lab-eventbridge.md)

### Секреты и данные

11. [Secrets Manager и KMS](11-secrets-kms.md)
12. [Лаба: секреты без пароля в tfvars](12-lab-secrets-kms.md)
13. [RDS в private subnet](13-rds-private.md)
14. [Лаба: RDS + Secrets Manager](14-lab-rds-private.md)

### Compute

15. [ECS Fargate за ALB](15-ecs-fargate.md)
16. [Лаба: контейнерный API](16-lab-ecs-fargate.md)

### IaC в команде

17. [Remote state и окружения](17-remote-state.md)
18. [Лаба: S3 backend + workspaces](18-lab-remote-state.md)

### Наблюдаемость и безопасность

19. [CloudWatch: alarms, dashboard](19-cloudwatch.md)
20. [Лаба: алерт на ошибки Lambda](20-lab-cloudwatch.md)
21. [Security CI: tfsec, OIDC](21-security-ci.md)
22. [Лаба: scan + GitHub OIDC](22-lab-security-ci.md)

### Финал

23. [Финальный проект: Image Platform](23-final-project.md)

Эталон: [`projects/image-platform/`](projects/image-platform/) (расширение [image-pipeline](../aws-terraform/projects/image-pipeline/)).

## Что должно получиться к концу

- Рисуете и поднимаете VPC с public/private subnets.
- Отдаёте HTTP API через API Gateway + Lambda.
- Ставите SQS + DLQ между producer и worker.
- Храните пароли в Secrets Manager, шифруете S3 KMS.
- Понимаете, когда Lambda, когда ECS Fargate.
- Настраиваете remote state и alarm в CloudWatch.

## Маршрут

```text
aws-basic → aws-terraform → aws-intermediate → [aws-advanced](../aws-advanced/README.md)
                                    │
                                    └── kuber-advanced (EKS, IRSA) — опционально
```

## Связь с Kubernetes

| AWS Intermediate | Kubernetes |
|---|---|
| ALB + Target Group | Ingress + Service |
| ECS Fargate | Deployment (managed nodes) |
| SQS backpressure | HPA + queue workers |
| Private subnet + RDS | StatefulSet + NetworkPolicy |
| IRSA (в advanced) | ServiceAccount |
