# 11. AWS WAF и Shield

## AWS WAF

Web Application Firewall на **ALB, API Gateway, CloudFront, AppSync**.

| Rule type | Пример |
|---|---|
| Managed rule group | AWSManagedRulesCommonRuleSet (OWASP) |
| Rate-based | block IP > 2000 req/5 min |
| Geo match | block country |
| Custom | block `/admin` without header |

```text
Internet → CloudFront/ALB → WAF (allow/deny) → origin
```

**Web ACL** — набор rules с priority (lower number = first).

## AWS Shield

| | Shield Standard | Shield Advanced |
|---|---|---|
| Цена | бесплатно | платная подписка |
| DDoS L3/L4 | базовая защита | расширенная + DRT |
| WAF | отдельно | включено |

## Связь с Kubernetes

Ingress → ALB → **associate WAF Web ACL** с ALB ARN.

## Логирование

WAF logs → S3 / Kinesis / CloudWatch — для forensics и tuning false positives.

## Чек-лист

- WAF на каком уровне OSI?
- Managed rules — зачем?
- Rate-based rule — от чего защищает?
- Shield Standard — нужно включать?

Следующий урок: [12-lab-waf.md](12-lab-waf.md).
