# 09. Savings Plans, Reserved, Spot

## Введение

**On-Demand** — максимальная гибкость, максимальная цена. При **предсказуемой** базовой нагрузке commit даёт до **~72%** скидки — но **obligation** на 1–3 года.

Обзор: [aws-advanced/25](../aws-advanced/25-cost-optimization.md).

---

## Сравнение моделей

| Модель | Гибкость | Скидка | Риск |
|--------|----------|--------|------|
| On-Demand | полная | 0 | нет |
| **Compute Savings Plan** | любой region/instance family (EC2, Fargate, Lambda) | высокая | hourly commit $ |
| EC2 Instance Savings Plan | привязка к family (e.g. M5) | выше SP compute | меньше гибкости |
| Standard RI | instance type + AZ | высокая | низкая утилизация = waste |
| Convertible RI | exchange type | средняя | сложность |
| Spot | прерывание 2 min notice | до ~90% | только fault-tolerant |

---

## Savings Plans — как думать

```text
Commit: $10/hour for 1 year
→ скидка применяется к eligible usage до $10/h
→ сверх commit — on-demand rates
```

**Coverage report** в Cost Explorer: % on-demand covered. Цель **70–90%** coverage стабильной базы, не 100% (остаток on-demand для spikes).

---

## Spot в EKS / ASG

- **Spot node group** + **on-demand baseline** для system/critical.
- **Pod disruption budgets** — graceful drain.
- Diversification instance types — меньше capacity crunch.

---

## Lambda / S3 / DynamoDB

- Lambda — **Compute SP** может покрывать; часто on-demand проще на старте.
- S3 — нет RI; Intelligent-Tiering, lifecycle.
- DynamoDB — **Reserved capacity** при steady RCU/WCU.

---

## Процесс закупки

1. **30–60 days** on-demand baseline в CUR.
2. Исключить **dev/sandbox** из commit.
3. Finance approves $/hour commit.
4. Quarterly **utilization review**.

---

## Резюме

Commit — для **стабильного** слоя; Spot — для **batch/stateless**; on-demand — spikes и эксперименты. Не покупайте SP до стабилизации архитектуры после миграции.

---

## Чек-лист

- [ ] Знаете текущий SP/RI coverage %?
- [ ] Spot только для workloads с interruption tolerance?
- [ ] Dev account исключён из 3-year commit?

**Дальше:** [10. Governance](10-governance.md).
