# Optional: продвинутые лабы на реальном AWS

Курс `aws-advanced` **не требует** постоянного платного AWS, но часть тем полноценно только в облаке.

## Budget

- AWS Budgets: $10/month alert на account
- После каждой лабы: `terraform destroy`
- Самые дорогие: **NAT Gateway**, **EKS control plane**, **ALB**

## Лабы «только real AWS»

| Урок | Ресурсы | Ориентир стоимости |
|---|---|---|
| 04 SCP | Organizations (management account) | бесплатно |
| 08 TGW | Transit Gateway + attachments | $/час |
| 12 WAF | WAF + ALB | $ + запросы |
| 14 EKS | EKS cluster + 2 nodes | $/час |
| 24 CRR | 2 region S3 + replication | storage + transfer |

## Organizations sandbox

1. Management account (root) — только org admin, без workloads.
2. Member account `course-dev` — все лабы.
3. Не использовать production account компании.

## EKS минимум

```bash
eksctl create cluster --name course-adv --region eu-central-1 \
  --nodes 2 --node-type t3.medium --managed
# после лабы:
eksctl delete cluster --name course-adv
```

Альтернатива без EKS bill: фаза 3 на **mockctl** + IRSA-аналог через annotated ServiceAccount (ограниченно) — см. [14-lab-eks.md](14-lab-eks.md).

## Чек-лист после лабы

- [ ] `terraform destroy` или `eksctl delete`
- [ ] NAT Gateway удалён
- [ ] Нет висящих EBS/RDS
- [ ] Budget на следующий день — $0 прирост
