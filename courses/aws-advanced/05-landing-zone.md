# 05. Landing Zone и Control Tower

## Landing Zone

**Landing Zone** — baseline multi-account environment: сеть, logging, security, IAM patterns «из коробки».

Компоненты типичного LZ:

| Компонент | Назначение |
|---|---|
| Organizations + OU | структура |
| SCP | guardrails |
| Central logging account | CloudTrail, Config, VPC Flow |
| Shared services | DNS, egress, CI |
| Account factory | новый account за минуты |

## AWS Control Tower

Managed service поверх Organizations:

- **Account Factory** — создаёт account с baseline.
- **Guardrails** — managed SCP (например disallow public S3).
- **Dashboard** — drift, non-compliance.

Альтернативы: **Terraform Landing Zone Accelerator (LZA)**, **AFT** (Account Factory for Terraform) — для команд без Control Tower UI.

## Account vending flow

```text
Request (ServiceNow / PR)
    → AFT / Control Tower
    → New account in Workloads OU
    → Default VPC disabled, logging enabled
    → CI role pre-created
```

## vs «ручной» Terraform

| Control Tower | Custom Terraform LZ |
|---|---|
| Быстрый старт | Полный контроль |
| Меньше гибкости | Больше поддержки |
| AWS opinionated | Ваши стандарты |

## Чек-лист

- Что такое Landing Zone одним предложением?
- Зачем central logging account?
- Control Tower vs eksctl — разные уровни?
- Account Factory — что создаёт?

Следующий урок: [06-lab-oidc-ci.md](06-lab-oidc-ci.md).
