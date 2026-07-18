# 14. Зоны безопасности, zero trust, DDoS на краю

## Введение

Сеть — не только connectivity, но и **границы доверия**. Связь: [linux-security](../linux-security/README.md), [aws-advanced/11 WAF](../aws-advanced/11-waf-shield.md), [secrets-basic](../secrets-basic/README.md).

---

## Defense in depth (сетевой слой)

```text
Internet
  → DDoS scrubbing / WAF (L7)
  → Perimeter FW / ALB SG
  → Public subnet (bastion, LB only)
  → Private app subnet (SG: only from LB SG)
  → Data subnet (SG: only from app SG)
```

Каждый hop — **отдельное** правило, не «один firewall на всё».

---

## Zero trust (сетевой аспект)

- **Нет** implicit trust внутри VPC («мы в private — значит безопасно»).
- **mTLS** или identity-aware proxy между сервисами.
- **Micro-segmentation:** SG per tier, NetworkPolicy per namespace.
- **Least privilege egress:** не весь `0.0.0.0/0` из app subnet без причины.

---

## Bastion vs SSM vs VPN

| Доступ | Риск | Примечание |
|--------|------|------------|
| Bastion SSH | ключи, jump host compromise | SG only from corp IP |
| SSM Session Manager | без inbound SSH | IAM policy |
| Client VPN | broad L3 into VPC | split tunnel preferred |

Проверка «с bastion пинг есть» **не** заменяет user path.

---

## DDoS и volumetric

- **Edge:** Shield, CloudFront, WAF rate limits.
- **ALB:** connection surges, scale targets.
- **NACL** — грубый hammer (stateless), осторожно с ephemeral return.

Application-layer flood (expensive API) лечится **L7 rate limit** и auth, не только firewall.

---

## Exfiltration paths

- Open egress NAT → miner, data leak.
- VPC endpoint misconfig → data to wrong account (редко, но IAM + bucket policy).
- DNS tunneling — мониторинг anomalous DNS ([10-dns-production](10-dns-production.md)).

---

## Compliance сети (кратко)

- **Segmentation** PCI: CDE isolated.
- **Logging:** VPC Flow Logs, ALB access logs, firewall logs.
- **Encryption in transit:** TLS everywhere, IPsec for site-to-site.

---

## В mock-exams

- WAF lab: [aws-advanced/12](../aws-advanced/12-lab-waf.md)
- linux-security: [linux-security](../linux-security/README.md)

---

## Резюме

Безопасная сеть — **минимальные пути** и **явный deny**. Zero trust убирает «private = safe». DDoS — многослойно: edge + app limits.

---

## Чек-лист

- [ ] Нарисуйте три зоны для вашего сервиса.
- [ ] Где у вас открыт egress и зачем?
- [ ] Чем WAF отличается от SG?

**Дальше:** [15. Лаба troubleshooting](15-lab-troubleshooting.md).
