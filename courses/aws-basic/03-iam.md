# 03. IAM: пользователи, роли, политики

## Зачем IAM

**IAM (Identity and Access Management)** — глобальный сервис AWS: **кто** может **что** делать с **какими** ресурсами.

Без IAM:

- Любой с access key мог бы удалить всё в account.
- Приложения не могли бы получать минимальные права (principle of least privilege).

IAM **не** взимает плату. Это не Active Directory, но концепции похожи.

## Основные сущности

| Сущность | Что это | Когда использовать |
|---|---|---|
| **Root user** | Email, с которым создан account | Только billing, break-glass; **не для daily work** |
| **IAM User** | Человек или сервис с долгоживущими credentials | Legacy; избегайте для приложений |
| **IAM Group** | Набор users (Developers, Admins) | Удобно назначать политики группе |
| **IAM Role** | Набор permissions **без** своих ключей | EC2, Lambda, cross-account, **рекомендуется** |
| **Policy** | JSON-документ с permissions | Прикрепляется к user/role/group |

```text
Policy (документ прав)
    │
    ├── attach → User "alice"
    ├── attach → Group "developers" → bob, carol
    └── attach → Role "lambda-s3-reader"
                      │
                      └── assume → Lambda function
```

## Policy document

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBuckets",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::my-course-*"
    },
    {
      "Effect": "Deny",
      "Action": "s3:DeleteBucket",
      "Resource": "*"
    }
  ]
}
```

| Поле | Значение |
|---|---|
| `Effect` | `Allow` или `Deny` (**Deny всегда побеждает**) |
| `Action` | API-операция (`ec2:StartInstances`, `s3:GetObject`) |
| `Resource` | ARN ресурса или `*` |
| `Condition` | IP, MFA, время, tags (опционально) |

### Managed vs Inline policies

- **AWS Managed** — готовые (`AdministratorAccess`, `ReadOnlyAccess`). Не давайте `AdministratorAccess` без нужды.
- **Customer Managed** — ваши, переиспользуемые.
- **Inline** — привязаны к одному user/role, удаляются вместе с ним.

## ARN — идентификатор ресурса

```text
arn:aws:iam::123456789012:role/lambda-execution
arn:aws:s3:::my-bucket/object.jpg
arn:aws:ec2:eu-central-1:123456789012:instance/i-0abc123
```

Формат: `arn:partition:service:region:account-id:resource`.

## Роли vs пользователи

### IAM User + Access Key (старый паттерн)

```text
Developer → Access Key ID + Secret → aws cli
```

Минусы: ключи утекают, их сложно ротировать, они долгоживущие.

### IAM Role (современный паттерн)

```text
Lambda → assume Role "lambda-role" → временные credentials (STS)
EC2 instance profile → Role → доступ к S3 без ключей в коде
```

**AssumeRole** через **STS (Security Token Service)** выдаёт временные ключи (обычно 1 час).

## Trust policy (кто может надеть роль)

У Role два типа policy:

1. **Permission policy** — что роль **может делать**.
2. **Trust policy** — **кто может** стать этой ролью.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
```

Lambda «надевает» роль, потому что trust policy разрешает `lambda.amazonaws.com`.

## IRSA (для EKS)

В Kubernetes на AWS поды получают IAM Role через **IAM Roles for Service Accounts** — аналог ServiceAccount + RBAC, но для AWS API.

## MFA и least privilege

- Включите **MFA** на root и admin users.
- Давайте минимум прав: `s3:GetObject` на один bucket, не `s3:*` на `*`.
- Используйте **IAM Access Analyzer** для поиска избыточных прав.

## Локальная эмуляция

LocalStack / MiniStack **не проверяют** реальные ключи. В Terraform и CLI часто:

```hcl
access_key = "test"
secret_key = "test"
```

Поведение IAM упрощено, но API вызовы (`iam:CreateRole`) работают для обучения.

## Чек-лист

- Почему root user не для ежедневной работы?
- Чем Role отличается от User?
- Что побеждает: Allow или Deny?
- Зачем Lambda нужна Role, а не Access Key?
- Что такое ARN?

Следующий урок: [04-vpc-networking.md](04-vpc-networking.md).
