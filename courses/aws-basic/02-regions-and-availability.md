# 02. Регионы, AZ и глобальная инфраструктура

## Region (регион)

**Region** — именованная географическая область AWS (например `eu-central-1` во Франкфурте, `us-east-1` в Северной Вирджинии).

- Большинство ресурсов **привязаны к региону**: EC2, VPC, RDS, Lambda.
- Данные **физически** остаются в регионе (важно для GDPR и compliance).
- Цены и доступность сервисов **различаются** по регионам.

Выбор региона — одно из первых архитектурных решений:

| Критерий | Пример |
|---|---|
| Близость к пользователям | EU для европейской аудитории |
| Цена | `us-east-1` часто дешевле |
| Доступность сервиса | Новые фичи сначала в `us-east-1` |
| Юридические требования | Данные не покидают EU |

## Availability Zone (AZ)

Внутри региона — несколько **изолированных** дата-центров, называемых **Availability Zones** (`eu-central-1a`, `eu-central-1b`, …).

- AZ в одном регионе связаны **низколатентной** сетью.
- AZ **физически изолированы** (разные здания, питание) — отказ одного AZ не должен уронить другой.
- High Availability = распределение по **минимум 2 AZ**.

```text
Region eu-central-1
├── eu-central-1a   ← AZ
├── eu-central-1b   ← AZ
└── eu-central-1c   ← AZ
```

**Правило:** production RDS / EKS / EC2 Auto Scaling Group — **multi-AZ**.

## Local Zone и Wavelength (кратко)

- **Local Zones** — «приближённые» мини-регионы к крупным городам (низкая задержка).
- **Wavelength** — вычисления на edge операторов 5G.

Для базового курса достаточно знать, что существуют; редко нужны на старте.

## Глобальные vs региональные сервисы

| Тип | Примеры | Где «живёт» |
|---|---|---|
| **Глобальные** | IAM, Route 53 (частично), CloudFront | Везде / edge |
| **Региональные** | EC2, S3, Lambda, VPC | Конкретный region |
| **S3 — особый** | Имя bucket глобально уникально; данные в выбранном region | |

**IAM** — глобальный: пользователи и роли одни на весь account. **S3 bucket** `my-app-data` — одно имя во всём AWS.

## Edge Locations и CloudFront

**Edge Location** — точка присутствия CDN (сотни по миру). **CloudFront** кэширует статику (S3, custom origin) ближе к пользователю.

```text
Пользователь (Токио)
    → Edge Location (Токио)  ← cache hit, быстро
    → Origin (S3 eu-central-1)  ← cache miss
```

## Partition и endpoints

AWS разделён на **partitions**:

| Partition | Описание |
|---|---|
| `aws` | Публичное коммерческое облако |
| `aws-cn` | Китай (отдельные аккаунты) |
| `aws-us-gov` | Гос. сектор США |

API endpoint для `eu-central-1`: `ec2.eu-central-1.amazonaws.com`. LocalStack подменяет на `localhost:4566`.

## Практические паттерны

### Single-AZ (только dev)

```text
VPC → 1 public subnet → 1 EC2
```

Дёшево, ненадёжно.

### Multi-AZ (production)

```text
VPC → public subnets (2 AZ) + private subnets (2 AZ)
      ALB (multi-AZ) → EC2 ASG (2 AZ) → RDS Multi-AZ
```

### Active-Passive между регионами

Disaster Recovery: реплика в другой region (дорого, сложно). Для курса — знать, что бывает.

## Чек-лист

- Чем Region отличается от AZ?
- Почему production БД делают Multi-AZ?
- IAM глобальный или региональный?
- Глобально уникально ли имя S3 bucket?
- Зачем CloudFront, если S3 уже в регионе?

Следующий урок: [03-iam.md](03-iam.md) — без IAM в AWS никуда.
