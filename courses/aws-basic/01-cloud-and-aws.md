# 01. Облако и AWS: зачем и как устроено

## Что такое «облако»

**Облачные вычисления** — модель, в которой вы **арендуете** IT-ресурсы (серверы, хранилища, БД, сети) у провайдера и платите за **фактическое потребление**, а не покупаете железо в ЦОД.

Три основные модели (по NIST):

| Модель | Кто управляет | Примеры |
|---|---|---|
| **IaaS** | Вы — ОС, приложения; провайдер — железо, сеть | AWS EC2, GCP Compute |
| **PaaS** | Вы — код; провайдер — runtime, ОС | AWS Elastic Beanstalk, Heroku |
| **SaaS** | Вы — только пользуетесь | Gmail, Salesforce |

AWS — в первую очередь **IaaS** и набор managed-сервисов поверх него (RDS, Lambda, S3).

## Почему AWS

- **Огромный каталог сервисов** — от виртуальных машин до ML и спутников.
- **Глобальная инфраструктура** — регионы на всех континентах.
- **Зрелая экосистема** — документация, сертификации, Terraform, LocalStack.
- **Pay-as-you-go** — не платите за простаивающие серверы (если выключили).

Минусы: сложность, риск **неправильно настроить биллинг**, vendor lock-in на уровне API.

## Shared Responsibility Model

AWS делит ответственность с клиентом:

```text
┌─────────────────────────────────────────┐
│  Клиент: данные, конфигурация,          │
│  шифрование (в приложении), IAM,        │
│  security groups, патчи ОС на EC2       │
├─────────────────────────────────────────┤
│  AWS: железо, гипервизор, физическая    │
│  безопасность ЦОД, managed-сервисы      │
│  (патчи RDS engine, инфра Lambda)       │
└─────────────────────────────────────────┘
```

**Правило:** AWS отвечает **за облако**, вы — **в облаке**. Утечка S3 bucket с публичным доступом — ваша ответственность.

## Как устроен AWS «сверху»

```text
                    AWS Account (корневая граница биллинга и IAM)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
    Region: eu-central-1   us-east-1          ap-southeast-1
         │                    │
    ┌────┴────┐          ┌────┴────┐
    AZ-a     AZ-b         AZ-a     AZ-b
         │                    │
    VPC, EC2, RDS,      S3 (global namespace,
    Lambda, ...          но данные в регионе)
```

- **Account** — изолированный контейнер: свой биллинг, свои пользователи IAM, свои ресурсы.
- **Region** — географический кластер дата-центров (выбираете при создании большинства ресурсов).
- **Service** — продукт AWS (S3, EC2, Lambda). У каждого свой API endpoint.

## Основные категории сервисов

| Категория | Примеры | Аналог «на земле» |
|---|---|---|
| Compute | EC2, Lambda, ECS, EKS | Серверы, контейнеры |
| Storage | S3, EBS, EFS | Диски, файловое хранилище |
| Database | RDS, DynamoDB, ElastiCache | Postgres, Redis |
| Networking | VPC, ALB, Route 53, CloudFront | LAN, DNS, CDN |
| Security | IAM, KMS, Secrets Manager | LDAP, vault |
| Integration | SQS, SNS, EventBridge | Очереди, pub/sub |

В этом курсе разберём compute, storage, network, IAM, serverless и messaging.

## Console, CLI, API, IaC

Один и тот же AWS доступен четырьмя способами:

| Способ | Для кого |
|---|---|
| **AWS Console** (веб) | Обучение, разовые действия |
| **AWS CLI** (`aws s3 ls`) | Скрипты, автоматизация |
| **SDK** (boto3, aws-sdk-go) | Приложения |
| **IaC** (Terraform, CloudFormation) | Production, GitOps, курсы |

**Production:** почти всегда IaC + CI. Console — для отладки.

## Free Tier и биллинг

- При регистрации привязывается карта.
- **Free Tier** — лимиты на 12 месяцев и always-free (например, Lambda invocations).
- Без контроля легко получить счёт: открытый S3, забытый EC2 `t2.large`, NAT Gateway.

Для обучения в нашем репозитории — **LocalStack / MiniStack** ([10-local-emulation.md](10-local-emulation.md)), не реальный AWS.

## Связь с Kubernetes

Если вы прошли `kuber-*` курсы:

| Концепция AWS | Kubernetes |
|---|---|
| AWS Account | — |
| Region | — (кластер привязан к региону) |
| VPC | Сеть, в которой живут ноды |
| EKS | Managed control plane + ваши worker nodes |
| IAM Role for Service Account (IRSA) | ServiceAccount + RBAC |
| ALB Ingress Controller | Ingress → AWS Load Balancer |

EKS — это Kubernetes **на** AWS, а не замена AWS.

## Чек-лист

- Чем IaaS отличается от SaaS?
- Что такое Shared Responsibility Model?
- Из чего состоит иерархия: Account → Region → AZ?
- Назовите 3 способа управлять AWS кроме Console.
- Почему для курса мы рекомендуем локальную эмуляцию?

Следующий урок: [02-regions-and-availability.md](02-regions-and-availability.md).
