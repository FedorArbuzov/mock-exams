# Image Platform Enterprise (финальный проект aws-advanced)

Эволюция [`image-platform`](../../aws-intermediate/projects/image-platform/).

## Что добавить поверх intermediate

| Компонент | Модуль / doc |
|---|---|
| Multi-account diagram | `docs/architecture.md` |
| GitHub OIDC CI | `docs/oidc-ci.md` |
| WAF | `terraform/modules/security/waf.tf` |
| EKS + IRSA | `terraform/modules/eks/` + `kubernetes/` |
| Org trail / Config | `terraform/modules/security/compliance.tf` |
| S3 CRR | `terraform/modules/data/crr.tf` |
| Budget | `terraform/modules/security/budget.tf` |

## Треки

| Трек | Описание |
|---|---|
| A | Документация + `terraform plan` без полного apply |
| B | EKS + IRSA + Ingress (real AWS) |
| C | Full enterprise (Organizations + TGW) |

См. [27-final-project.md](../../27-final-project.md).

## Старт

1. Скопируйте `image-platform` как базу data plane.
2. Заполните `docs/architecture.md` (шаблон ниже).
3. Добавляйте модули по фазам курса.

## Шаблон architecture.md

```markdown
# Architecture

## Accounts
- Management: ...
- Workloads-dev: ...
- Workloads-prod: ...

## Data flow
(диаграмма Mermaid из 27-final-project)

## Security controls
- SCP: ...
- WAF: ...
- IRSA: ...

## DR
- RPO/RTO: ...
- CRR: region B
```
