# 23. Финальный проект: Image Platform

## Цель

Собрать **production-style** платформу обработки изображений — эволюция [`image-pipeline`](../../aws-terraform/projects/image-pipeline/) из `aws-terraform`.

## Архитектура

```text
                         ┌──────────────────┐
                         │  API Gateway     │
                         │  GET /images/{id}│
                         │  POST /upload-url│
                         └────────┬─────────┘
                                  │
┌──────────┐   upload   ┌─────────▼─────────┐   EventBridge/SQS   ┌─────────────┐
│  Client  │───────────►│  S3 uploads/      │────────────────────►│ Lambda      │
└──────────┘            │  (KMS encrypted)  │                     │ worker      │
                        └───────────────────┘                     └──────┬──────┘
                                                                         │
                        ┌───────────────────┐         ┌──────────────────▼──────┐
                        │  S3 thumbs/       │◄────────│  DynamoDB metadata      │
                        └───────────────────┘         └─────────────────────────┘
                        ┌───────────────────┐
                        │  DLQ + SNS alarm  │
                        └───────────────────┘
```

Опционально: ECS Fargate API за ALB, RDS для отчётов, CloudFront для thumbs.

## Эталонный код

[`projects/image-platform/`](projects/image-platform/) — Terraform-модули:

| Файл / каталог | Содержимое |
|---|---|
| `network.tf` | VPC, public subnets, SG |
| `data.tf` | S3 KMS, DynamoDB |
| `messaging.tf` | SQS, DLQ, EventBridge |
| `compute.tf` | Lambda worker + API |
| `api.tf` | API Gateway |
| `observability.tf` | Logs, alarms, SNS |
| `lambda/` | worker handler |
| `lambda-api/` | REST handler |

## Требования (самостоятельно / по эталону)

| # | Критерий |
|---|---|
| 1 | S3: encryption KMS, block public |
| 2 | Upload только в `uploads/`; обработка → `thumbs/` |
| 3 | Очередь SQS + DLQ между событием и worker |
| 4 | API Gateway: GET metadata по id |
| 5 | Secrets Manager для API key (header check) |
| 6 | CloudWatch alarm на DLQ или Lambda errors |
| 7 | Terraform modules или отдельные `.tf` по слоям |
| 8 | README: apply, test, destroy |
| 9 | `tfsec` без HIGH |
| 10 | (Бонус) presigned upload URL |

## Запуск

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
cd courses/aws-intermediate/projects/image-platform
cp terraform.tfvars.example terraform.tfvars
./scripts/build-lambdas.sh
tflocal init && tflocal apply
./scripts/smoke-test.sh
```

## Сдача

- Ссылка на репозиторий / PR
- Скрин `dynamodb scan` + `s3 ls thumbs/` после smoke test
- Краткое README: что бы изменили для prod

## Переход на prod

1. Remote state (урок 18)
2. `use_localstack = false`
3. NAT + RDS — [optional-aws.md](optional-aws.md)
4. Budget alert

## После курса

- **aws-advanced** (план): Organizations, WAF, multi-region DR, EKS+IRSA
- Связка с **kuber-advanced**: тот же workload на EKS

Поздравляем с завершением **aws-intermediate**.
