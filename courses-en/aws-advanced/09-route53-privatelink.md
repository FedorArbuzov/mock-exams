# 09. Route 53 and PrivateLink

## Route 53

| Zone type | Purpose |
|---|---|
| Public hosted zone | `api.example.com` on the internet |
| Private hosted zone | `db.internal` only inside the VPC |

**Routing policies:**

| Policy | Scenario |
|---|---|
| Simple | one A record |
| Weighted | canary 10% / 90% |
| Latency | nearest region |
| Failover | primary + secondary + health check |
| Geolocation | by country |

## Health checks

Route 53 pings the endpoint; on failure — failover to the secondary record.

```text
Primary ALB (eu-central-1)  ──health OK──► users
        │ fail
        ▼
Secondary ALB (eu-west-1)
```

## PrivateLink

Access to an **AWS service** or **vendor SaaS** without the public internet:

```text
VPC consumer → Interface Endpoint (ENI) → AWS service (S3, DynamoDB, custom NLB)
```

| Type | Example |
|---|---|
| Gateway Endpoint | S3, DynamoDB (free, only in the VPC route) |
| Interface Endpoint | everything else, PrivateLink |

## Hybrid DNS

Resolver rules: `corp.example.com` → on-prem DNS over VPN.

## Checklist

- Private vs public hosted zone?
- Does a failover policy work without a health check?
- Interface Endpoint vs Gateway Endpoint?
- Why PrivateLink for SaaS?

Next lesson: [10-lab-route53.md](10-lab-route53.md).
