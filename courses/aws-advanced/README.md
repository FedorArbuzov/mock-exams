# AWS Advanced

Продвинутый уровень для DevOps / Platform / Cloud Engineer. Подразумеваются [`aws-basic`](../aws-basic/README.md), [`aws-terraform`](../aws-terraform/README.md) и [`aws-intermediate`](../aws-intermediate/README.md).

Цель — **управлять AWS на уровне организации**: multi-account, enterprise-сеть, EKS+IRSA, security tooling, DR и cost.

Для блока EKS желательно пройти [`kuber-intermediate`](../kuber-intermediate/README.md) или [`kuber-advanced`](../kuber-advanced/README.md).

## Маршрут по фазам

Проходите **по фазам**; номера файлов — ориентир, не строгий порядок внутри фазы.

### Фаза 1 — Multi-account и governance

| # | Урок |
|---|---|
| 01 | [AWS Organizations](01-organizations.md) |
| 02 | [Лаба: cross-account role](02-lab-cross-account.md) |
| 03 | [SCP и guardrails](03-scp-governance.md) |
| 04 | [Лаба: SCP в Organizations](04-lab-scp.md) |
| 05 | [Landing Zone и Control Tower](05-landing-zone.md) |
| 06 | [Лаба: OIDC для CI в prod account](06-lab-oidc-ci.md) |

### Фаза 2 — Enterprise network

| # | Урок |
|---|---|
| 07 | [Transit Gateway и peering](07-transit-gateway.md) |
| 08 | [Лаба: hub-spoke VPC](08-lab-transit-gateway.md) |
| 09 | [Route 53 и PrivateLink](09-route53-privatelink.md) |
| 10 | [Лаба: health check и failover](10-lab-route53.md) |
| 11 | [WAF и Shield](11-waf-shield.md) |
| 12 | [Лаба: WAF на ALB](12-lab-waf.md) |

### Фаза 3 — EKS и Kubernetes на AWS

| # | Урок |
|---|---|
| 13 | [EKS: control plane и node groups](13-eks-architecture.md) |
| 14 | [Лаба: минимальный EKS / сравнение с mockctl](14-lab-eks.md) |
| 15 | [IRSA: IAM Roles for Service Accounts](15-irsa.md) |
| 16 | [Лаба: Pod → S3 через IRSA](16-lab-irsa.md) |
| 17 | [AWS Load Balancer Controller](17-alb-ingress.md) |
| 18 | [Лаба: Ingress для Image Platform](18-lab-alb-ingress.md) |

### Фаза 4 — Security operations

| # | Урок |
|---|---|
| 19 | [KMS, rotation, организационные секреты](19-kms-advanced.md) |
| 20 | [Лаба: rotation и шифрование](20-lab-kms-secrets.md) |
| 21 | [GuardDuty, Config, CloudTrail](21-guardduty-config-trail.md) |
| 22 | [Лаба: Config rule и trail](22-lab-guardduty-config.md) |

### Фаза 5 — DR, backup, cost

| # | Урок |
|---|---|
| 23 | [Backup, CRR, RTO/RPO](23-backup-dr.md) |
| 24 | [Лаба: S3 cross-region replication](24-lab-s3-crr.md) |
| 25 | [Cost: tags, budgets, Savings Plans](25-cost-optimization.md) — обзор; углубление → [`finops`](../finops/README.md) |
| 26 | [Лаба: budget alert](26-lab-cost-budgets.md) |

### Фаза 6 — Финал

| # | Урок |
|---|---|
| 27 | [Финальный проект: Image Platform Enterprise](27-final-project.md) |

Эталон и шаблон: [`projects/image-platform-enterprise/`](projects/image-platform-enterprise/).

## Опционально (самостоятельно)

| Тема | Где |
|---|---|
| Step Functions для pipeline | AWS docs + доработка `image-platform` |
| Kinesis вместо SQS | high-throughput трек |
| Полный TGW в AWS | [optional-aws-advanced.md](optional-aws-advanced.md) |

## Требования

| Инструмент | Назначение |
|---|---|
| Terraform ≥ 1.5 | IaC |
| AWS CLI v2 | org, eks, waf |
| `kubectl` + кластер | фаза 3 (mockctl или EKS) |
| Docker / LocalStack | часть лаб intermediate-уровня |

**Real AWS:** фазы 1–2, 4–5 и EKS — dev-account + [optional-aws-advanced.md](optional-aws-advanced.md) + Budget alert.

## Связь с другими курсами

```text
aws-intermediate (image-platform)
        ↓
aws-advanced (enterprise + EKS + org)
        ↕
kuber-advanced (EKS эксплуатация, GitOps, security)
```

## Подходит для подготовки к

- **AWS Solutions Architect Professional** (архитектурные паттерны)
- **AWS Security Specialty** (фаза 4)
- Платформенная роль «AWS + Kubernetes»
