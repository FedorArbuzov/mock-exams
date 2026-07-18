# AWS + Terraform

Курс по **Infrastructure as Code** для AWS. Все лабы работают на **LocalStack** или **MiniStack** — платный AWS-аккаунт не обязателен.

**Предварительно:** [`aws-basic`](../aws-basic/README.md) (теория AWS).

## Требования

| Инструмент | Версия | Установка |
|---|---|---|
| Docker | 20+ | Docker Desktop / engine |
| Terraform | ≥ 1.5 | [terraform.io](https://developer.hashicorp.com/terraform/install) |
| AWS CLI v2 | любая | опционально, для проверки |
| Python 3 | 3.10+ | для `tflocal` и сборки Lambda zip |
| pip | — | `pip install terraform-local` |

Запуск эмулятора из корня репозитория:

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
```

Проверка: `curl -s http://localhost:4566/_localstack/health | head`

## Программа

### Основы Terraform

1. [Terraform: HCL, провайдер, plan/apply](01-terraform-intro.md)
2. [Лаба: первый S3 bucket](02-lab-terraform-intro.md)
3. [State, variables, outputs](03-state-and-variables.md)
4. [Лаба: variables и outputs](04-lab-state-and-variables.md)

### LocalStack

5. [Провайдер AWS и endpoints](05-aws-provider-localstack.md)
6. [Лаба: LocalStack + provider](06-lab-aws-provider-localstack.md)
7. [tflocal: один код для local и prod](07-tflocal.md)
8. [Лаба: workflow с tflocal](08-lab-tflocal.md)

### Сервисы AWS в Terraform

9. [IAM в Terraform: role, policy attachment](09-iam-terraform.md)
10. [Лаба: execution role для Lambda](10-lab-iam-terraform.md)
11. [S3: bucket, encryption, notifications](11-s3-terraform.md)
12. [Лаба: bucket и загрузка объекта](12-lab-s3-terraform.md)
13. [Lambda: zip, permissions, log group](13-lambda-terraform.md)
14. [Лаба: функция и invoke](14-lab-lambda-terraform.md)
15. [DynamoDB: table, keys, TTL](15-dynamodb-terraform.md)
16. [Лаба: таблица и put_item](16-lab-dynamodb-terraform.md)

### Интеграция

17. [Pipeline: S3 → Lambda → DynamoDB](17-s3-lambda-pipeline.md)
18. [Лаба: собрать pipeline вручную](18-lab-s3-lambda-pipeline.md)
19. [Модули Terraform](19-modules.md)
20. [Лаба: вынести S3 в модуль](20-lab-modules.md)
21. [CI: terraform plan в GitHub Actions](21-ci-terraform.md)
22. [Лаба: workflow для репозитория](22-lab-ci-terraform.md)

### Финал

23. [Финальный проект: image pipeline](23-final-project.md)

Эталонный код: [`projects/image-pipeline/`](projects/image-pipeline/).

## Что должно получиться к концу

- Пишете и применяете Terraform для S3, IAM, Lambda, DynamoDB.
- Запускаете тот же код локально (`tflocal`) и понимаете, что менять для реального AWS.
- Собираете event-driven pipeline без ручного кликанья в Console.
- Настраиваете `terraform plan` в CI.

## Структура лаб

Каждая лаба — каталог `~/aws-labs/lesson-NN/` (создаёте сами). Финальный проект можно клонировать из `projects/image-pipeline/`.

## Связь с aws-basic

| Урок aws-basic | Урок aws-terraform |
|---|---|
| 03 IAM | 09–10 |
| 06 S3 | 11–12, 17–18 |
| 07 DynamoDB | 15–16 |
| 08 Lambda | 13–14, 17–18 |
| 10 LocalStack | 05–08 |

## Дальше

- [`aws-intermediate`](../aws-intermediate/README.md) — VPC, API Gateway, SQS, EventBridge, observability.
- Реальный AWS dev-account + AWS Budgets alert.
- Terraform Cloud / S3 backend для state в команде.
