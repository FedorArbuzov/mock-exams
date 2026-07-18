# AWS Basic

Базовый курс по Amazon Web Services. Цель — понять **модель облака AWS**, ключевые сервисы и терминологию, чтобы дальше уверенно писать Terraform и практиковаться **локально** (LocalStack / MiniStack) без риска для счёта.

Terraform, `tflocal` и лабы — в курсе [`aws-terraform`](../aws-terraform/README.md). Здесь — только теория AWS.

## Для кого

- Начинающие в облаке (опыт Kubernetes из `kuber-*` курсов — плюс, но не обязателен).
- Те, кто хочет сдать **AWS Certified Cloud Practitioner (CLF-C02)** или готовиться к **Solutions Architect Associate**.
- Разработчики и DevOps перед курсом по IaC.

## Локальная практика (позже)

| Инструмент | RAM | Сервисов | Лицензия |
|---|---|---|---|
| [LocalStack](https://localstack.cloud/) | ~500 MB+ | 40+ | Community + Pro |
| [MiniStack](https://github.com/ministackorg/ministack) | ~30 MB | 41 | MIT, бесплатно |

Оба слушают порт `4566`. Подробнее — [10-local-emulation.md](10-local-emulation.md).

## Программа — теория ✅

Все 10 уроков готовы. Читайте по порядку.

### Введение

1. [Облако и AWS: зачем и как устроено](01-cloud-and-aws.md)
2. [Регионы, AZ и глобальная инфраструктура](02-regions-and-availability.md)
3. [IAM: пользователи, роли, политики](03-iam.md)

### Сеть и вычисления

4. [VPC: виртуальная сеть в AWS](04-vpc-networking.md)
5. [EC2 и модели вычислений](05-ec2-compute.md)

### Данные

6. [S3 и хранилища объектов](06-s3-storage.md)
7. [Базы данных: RDS, DynamoDB, ElastiCache](07-databases.md)

### Современные паттерны

8. [Serverless: Lambda, API Gateway](08-serverless-lambda.md)
9. [Очереди и события: SQS, SNS, EventBridge](09-messaging.md)

### Практика без счёта

10. [Локальная эмуляция AWS](10-local-emulation.md)

## Программа — практика (план)

| # | Тема | Статус |
|---|---|---|
| 11 | Лаба: IAM и CLI (`aws sts get-caller-identity`) | план |
| 12 | Лаба: S3 bucket через Console / CLI | план |
| … | Terraform + LocalStack | [`aws-terraform`](../aws-terraform/README.md) |

## Что должно получиться после теории

- Объясняете разницу Region / AZ / Edge.
- Понимаете, зачем IAM Role у Lambda, а не Access Key в коде.
- Можете нарисовать схему: пользователь → ALB → EC2 → RDS в private subnet.
- Знаете, когда S3, когда EBS, когда EFS.
- Понимаете, как учиться на LocalStack/MiniStack вместо платного AWS.

## Связь с Kubernetes-курсами

| AWS | Kubernetes (наши курсы) |
|---|---|
| Region / AZ | Cluster / Node |
| VPC, Subnet | CNI, NetworkPolicy |
| IAM Role | ServiceAccount + IRSA |
| EC2 | Node (worker) |
| ECS / EKS | Managed Kubernetes |
| ALB | Ingress / Service LoadBalancer |
| S3 | Object storage (не PV) |

## Дальше

- [`aws-terraform`](../aws-terraform/README.md) — IaC, `tflocal`, финальный проект S3+Lambda+DynamoDB.
- [`aws-intermediate`](../aws-intermediate/README.md) — VPC, API Gateway, SQS, observability.
- [`aws-advanced`](../aws-advanced/README.md) — Organizations, EKS+IRSA, WAF, DR.
- AWS официальная документация: [https://docs.aws.amazon.com/](https://docs.aws.amazon.com/)
