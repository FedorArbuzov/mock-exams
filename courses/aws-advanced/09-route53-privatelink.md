# 09. Route 53 и PrivateLink

## Route 53

| Тип зоны | Назначение |
|---|---|
| Public hosted zone | `api.example.com` в интернет |
| Private hosted zone | `db.internal` только внутри VPC |

**Routing policies:**

| Policy | Сценарий |
|---|---|
| Simple | один A record |
| Weighted | canary 10% / 90% |
| Latency | ближайший region |
| Failover | primary + secondary + health check |
| Geolocation | по стране |

## Health checks

Route 53 пингует endpoint; при fail — failover на secondary record.

```text
Primary ALB (eu-central-1)  ──health OK──► users
        │ fail
        ▼
Secondary ALB (eu-west-1)
```

## PrivateLink

Доступ к **AWS service** или **vendor SaaS** без публичного интернета:

```text
VPC consumer → Interface Endpoint (ENI) → AWS service (S3, DynamoDB, custom NLB)
```

| Тип | Пример |
|---|---|
| Gateway Endpoint | S3, DynamoDB (бесплатно, только в VPC route) |
| Interface Endpoint | всё остальное, PrivateLink |

## Hybrid DNS

Resolver rules: `corp.example.com` → on-prem DNS через VPN.

## Чек-лист

- Private vs public hosted zone?
- Failover policy без health check — работает?
- Interface Endpoint vs Gateway Endpoint?
- Зачем PrivateLink для SaaS?

Следующий урок: [10-lab-route53.md](10-lab-route53.md).
