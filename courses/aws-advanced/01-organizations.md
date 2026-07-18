# 01. AWS Organizations

## Зачем Organizations

Один **management account** объединяет несколько **member accounts**:

```text
Management (billing, SCP, org policies)
├── Security (logs, GuardDuty aggregator)
├── Workloads-dev
└── Workloads-prod
```

| Плюс | Описание |
|---|---|
| Consolidated billing | один счёт, разбивка по account |
| SCP | guardrails сверху IAM |
| Изоляция blast radius | компрометация dev ≠ prod |
| Централизованный audit | CloudTrail org trail |

## Organizational Units (OU)

```text
Root
├── Security OU
├── Sandbox OU
└── Workloads OU
      ├── dev
      └── prod
```

Политики SCP вешают на **OU** или **account** — наследуются вниз.

## Создание account

- **AWS Control Tower** — account factory с baseline.
- **Organizations API** — `CreateAccount` (email уникален).
- **Account vending** через Terraform `aws_organizations_account` (осторожно с email).

## Root user

В member account root всё ещё существует — **не используйте** для daily ops. Break-glass only.

## Связь с intermediate

Intermediate — один account. Advanced — **граница account** как граница безопасности и биллинга.

## Чек-лист

- Чем OU отличается от account?
- Зачем отдельный security account?
- Почему prod и dev — разные accounts?
- Что такое consolidated billing?

Следующий урок: [02-lab-cross-account.md](02-lab-cross-account.md).
