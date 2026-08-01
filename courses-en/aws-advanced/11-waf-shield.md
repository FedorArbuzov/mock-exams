# 11. AWS WAF and Shield

## AWS WAF

A Web Application Firewall on **ALB, API Gateway, CloudFront, AppSync**.

| Rule type | Example |
|---|---|
| Managed rule group | AWSManagedRulesCommonRuleSet (OWASP) |
| Rate-based | block IP > 2000 req/5 min |
| Geo match | block country |
| Custom | block `/admin` without header |

```text
Internet → CloudFront/ALB → WAF (allow/deny) → origin
```

A **Web ACL** — a set of rules with priority (lower number = first).

## AWS Shield

| | Shield Standard | Shield Advanced |
|---|---|---|
| Price | free | paid subscription |
| DDoS L3/L4 | basic protection | extended + DRT |
| WAF | separate | included |

## Relation to Kubernetes

Ingress → ALB → **associate a WAF Web ACL** with the ALB ARN.

## Logging

WAF logs → S3 / Kinesis / CloudWatch — for forensics and tuning false positives.

## Checklist

- WAF operates at which OSI layer?
- Managed rules — why?
- Rate-based rule — what does it protect against?
- Shield Standard — do you need to enable it?

Next lesson: [12-lab-waf.md](12-lab-waf.md).
