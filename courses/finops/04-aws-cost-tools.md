# 04. Cost Explorer, CUR, Budgets, аномалии

## Введение

AWS даёт несколько **уровней детализации** биллинга. Путаница «почему цифры не сходятся» — обычно разные **источники** и **lag**.

---

## Cost Explorer

| Возможность | Использование |
|-------------|---------------|
| Group by Service / Tag | топ spenders |
| Filter by linked account | multi-account |
| Forecast | тренд на конец месяца |
| Rightsizing recommendations | EC2, EBS (heuristic) |
| Savings Plans coverage | unused commit |

**Задержка:** ~24 часа для детальных данных; **today** — приблизительно.

Типичный workflow:

1. Last 30 days → Group by **Service**.
2. Drill into **EC2-Other** (часто NAT, IPs).
3. Group by tag **Team** → найти dev leak.

---

## AWS Budgets

| Тип | Когда |
|-----|--------|
| Cost budget | $/month на account или tag filter |
| Usage budget | часи `t3.micro`, GB S3 |
| Savings Plans utilization | commit не используется |
| Reservation coverage | RI не покрывает fleet |

**Пороги:**

| Threshold type | Смысл |
|----------------|--------|
| ACTUAL | уже потратили X% |
| FORECASTED | прогноз превысит лимит — **ранний** сигнал |

Пример Terraform — [aws-advanced/25](../aws-advanced/25-cost-optimization.md), лаба [13](13-lab-budgets-tags.md).

---

## Cost and Usage Report (CUR)

| | Cost Explorer | CUR |
|---|---------------|-----|
| UI | да | нет (S3 files) |
| Детализация | агрегаты | **строка на usage** |
| Анализ | быстрый | Athena, QuickSight, Kubecost |

CUR → S3 (Parquet) → **Athena**:

```sql
SELECT line_item_product_code,
       SUM(line_item_unblended_cost) AS cost
FROM cur_db.cur_table
WHERE line_item_usage_start_date >= DATE '2026-05-01'
GROUP BY 1
ORDER BY 2 DESC;
```

Запросы: «сколько стоил **NAT Gateway** по AZ», «тег Team отсутствует».

---

## Cost Anomaly Detection

ML baseline по service/account → alert в SNS/Chatbot. Полезно для:

- забытый **EKS cluster**
- утечка **S3 PUT** в loop
- новый **NAT** после лабы

Не заменяет **budgets** — дополняет.

---

## Billing Conductor / Invoice (кратко)

В **Organizations** — consolidated bill, credits, custom line items для resellers. Для engineer достаточно знать: **management account** видит все linked accounts.

---

## LocalStack caveat

Budgets/CUR в LocalStack **ограничены**. Лабы учат **правильный Terraform**; цифры — в [optional-aws](../aws-advanced/optional-aws-advanced.md) dev account.

---

## В mock-exams

- [13-lab-budgets-tags](13-lab-budgets-tags.md)
- [14-lab-cost-report](14-lab-cost-report.md)

---

## Резюме

**Explorer** — ежедневная навигация. **Budgets** — guardrails и алерты. **CUR** — forensic и точные отчёты. Anomaly — страховка от сюрпризов.

---

## Чек-лист

- [ ] FORECASTED budget на dev account настроен?
- [ ] Знаете топ-3 service codes за месяц?
- [ ] Когда нужен CUR вместо Explorer?

**Дальше:** [05. Rightsizing](05-rightsizing.md).
