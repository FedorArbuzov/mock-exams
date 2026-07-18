# 27. Финальный проект: Image Platform Enterprise

## Цель

Объединить все фазы advanced в **архитектуру уровня платформы** — эволюция [`image-platform`](../aws-intermediate/projects/image-platform/).

## Target architecture

```text
Organizations
├── Security account (org CloudTrail, Config aggregator)
├── Workloads-dev
│     └── image-platform (как intermediate)
└── Workloads-prod
      ├── VPC (TGW или single VPC prod)
      ├── EKS cluster
      │     ├── Namespace images
      │     ├── IRSA → S3 (CMK)
      │     ├── Ingress ALB + WAF
      │     └── Worker Job / optional Lambda
      ├── S3 source + CRR bucket (DR region)
      ├── DynamoDB + optional RDS reports
      ├── EventBridge bus (domain events)
      ├── GuardDuty + Config rules
      └── SNS alerts → on-call

CI: GitHub OIDC → assume role dev → plan
     GitHub Environment prod → apply (manual)
```

## Минимальные требования (сдача)

| # | Требование | Фаза |
|---|---|---|
| 1 | Диаграмма multi-account (даже если 1 account — показать целевую модель) | 1 |
| 2 | Cross-account или OIDC CI без long-lived keys | 1, 6 |
| 3 | SCP или tag policy document | 1 |
| 4 | WAF на публичном endpoint (ALB или CloudFront) | 2 |
| 5 | EKS + IRSA pod читает S3 | 3 |
| 6 | Ingress ALB к API | 3 |
| 7 | Config rule или GuardDuty enabled + runbook | 4 |
| 8 | S3 CRR **или** tabletop DR doc | 5 |
| 9 | Budget + cost tags | 5 |
| 10 | Terraform modules: `network`, `eks`, `data`, `security` | all |

## Рекомендуемая структура репо

```text
projects/image-platform-enterprise/
  README.md
  docs/
    architecture.md
    runbook-guardduty.md
    dr-failover.md
  terraform/
    envs/dev/
    envs/prod/
    modules/network/
    modules/eks/
    modules/data/
    modules/security/
  kubernetes/
    base/
    overlays/dev/
    overlays/prod/
```

## Треки по бюджету

| Трек | Что реально поднимаете |
|---|---|
| **A — Documentation** | Полная диаграмма + Terraform plan + mockctl IRSA-аналог |
| **B — Hybrid** | LocalStack data plane + EKS в AWS |
| **C — Full** | Всё в AWS dev/prod accounts |

Для курса достаточно **трека A + один компонент трека B** (например EKS+IRSA).

## Smoke test (prod-like)

1. Upload `uploads/test.jpg` → SQS → worker → `thumbs/` + DynamoDB.
2. `GET https://api.../images/{id}` через Ingress.
3. WAF block SQLi probe → 403.
4. Intentional DLQ message → alarm fires (or runbook walkthrough).

## Связь с kuber-advanced

| aws-advanced final | kuber-advanced |
|---|---|
| EKS + IRSA | cluster ops, upgrade |
| ALB Ingress | Ingress, NetworkPolicy |
| Platform security | Pod Security, admission |

Опционально: Argo CD deploy `kubernetes/overlays/prod` ([kuber-advanced/17](../kuber-advanced/17-lab-argocd.md)).

## Сдача

- PR или gist
- `docs/architecture.md` с диаграммой (Mermaid)
- Видео 5 мин или скриншоты smoke test
- **destroy checklist** подписан

## После курса

- **mock-saa** — имитация Solutions Architect exam
- Multi-region active-active
- FinOps углубление (Kubecost-style для AWS)

---

Поздравляем — трек **aws-basic → terraform → intermediate → advanced** завершён.
