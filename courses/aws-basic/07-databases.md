# 07. Базы данных в AWS

## Managed vs self-hosted

| Подход | Плюсы | Минусы |
|---|---|---|
| **RDS / Aurora** (managed SQL) | Бэкапы, патчи engine, Multi-AZ | Дороже, меньше контроля ОС |
| **EC2 + Postgres** | Полный контроль | Вы — DBA, патчи, HA |
| **DynamoDB** (NoSQL managed) | Масштаб, serverless | Другая модель данных |

Для production почти всегда **managed**.

## RDS (Relational Database Service)

Поддерживает **PostgreSQL, MySQL, MariaDB, Oracle, SQL Server**.

```text
App (private subnet)
    → Security Group: 5432 от app-sg
    → RDS instance (private subnet, Multi-AZ optional)
```

| Опция | Смысл |
|---|---|
| **Multi-AZ** | Синхронная реплика standby в другой AZ (failover ~ минута) |
| **Read Replica** | Асинхронная реплика для чтения |
| **Automated backups** | Point-in-time recovery |
| **Parameter group** | Настройки engine (`max_connections`) |

**Subnet group** — RDS живёт только в указанных private subnets.

## Aurora

AWS-оптимизированный SQL-совместимый engine (PostgreSQL/MySQL API). Storage **растёт автоматически**, до 15 read replicas, быстрый failover.

Дороже RDS, но для высоких нагрузок — стандарт.

## DynamoDB

**NoSQL**, key-value и document, **serverless** по модели:

| Концепция | Описание |
|---|---|
| **Table** | Коллекция items |
| **Partition key** | Распределение по шардам |
| **Sort key** | Опционально, составной ключ |
| **GSI / LSI** | Вторичные индексы |
| **On-demand vs provisioned** | Оплата за запросы vs зарезервированный RCU/WCU |

Пример item (метаданные картинки в финальном проекте):

```json
{
  "image_id": "abc-123",
  "bucket": "my-course-bucket",
  "s3_key": "uploads/abc-123.jpg",
  "width": 1920,
  "created_at": "2026-05-16T12:00:00Z"
}
```

**Single-table design** — продвинутый паттерн; для курса достаточно одной таблицы `images`.

## ElastiCache (кратко)

Managed **Redis** или **Memcached** — кэш сессий, rate limiting, не primary DB. Практика и ElastiCache в деталях: [redis-intermediate/19-managed-elasticache](../redis-intermediate/19-managed-elasticache.md), стенд [deploy/redis](../../deploy/redis/README.md).

## Выбор БД

| Задача | Сервис |
|---|---|
| Транзакции, JOIN, отчёты | RDS / Aurora (Postgres) |
| Миллионы ключей, предсказуемая latency, serverless | DynamoDB |
| Кэш | ElastiCache |
| Поиск full-text | OpenSearch (отдельный сервис) |

## Бэкапы и DR

- RDS: automated snapshots + retention.
- DynamoDB: **PITR** (point-in-time recovery), on-demand backup.
- Cross-region replica — для disaster recovery (стоимость + сложность).

## Секреты подключения

Не хардкодьте пароль в код:

```text
RDS master password → Secrets Manager / SSM Parameter Store
    → App читает при старте (IAM role)
```

## Локальная эмуляция

LocalStack: упрощённый RDS, DynamoDB API на `localhost:4566`. Поведение транзакций и performance не как в AWS — для **обучения API и Terraform** достаточно.

## Чек-лист

- Зачем RDS в private subnet?
- Чем Multi-AZ отличается от Read Replica?
- Когда DynamoDB вместо Postgres?
- Что такое partition key?
- Где хранить пароль от БД?

Следующий урок: [08-serverless-lambda.md](08-serverless-lambda.md).
