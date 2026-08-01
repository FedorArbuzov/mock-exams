# 04. Cost Explorer, CUR, Budgets, anomalies

## Intro

AWS provides several **levels of billing detail**. Confusion over “why the numbers don’t match” is usually different **sources** and **lag**.

---

## Cost Explorer

| Capability | Use |
|-------------|---------------|
| Group by Service / Tag | top spenders |
| Filter by linked account | multi-account |
| Forecast | trend to month end |
| Rightsizing recommendations | EC2, EBS (heuristic) |
| Savings Plans coverage | unused commit |

**Lag:** ~24 hours for detailed data; **today** is approximate.

Typical workflow:

1. Last 30 days → Group by **Service**.
2. Drill into **EC2-Other** (often NAT, IPs).
3. Group by tag **Team** → find the dev leak.

---

## AWS Budgets

| Type | When |
|-----|--------|
| Cost budget | $/month on an account or tag filter |
| Usage budget | hours of `t3.micro`, GB of S3 |
| Savings Plans utilization | commit unused |
| Reservation coverage | RI doesn’t cover the fleet |

**Thresholds:**

| Threshold type | Meaning |
|----------------|--------|
| ACTUAL | already spent X% |
| FORECASTED | forecast will exceed the limit — **early** signal |

Terraform example — [aws-advanced/25](../aws-advanced/25-cost-optimization.md), lab [13](13-lab-budgets-tags.md).

---

## Cost and Usage Report (CUR)

| | Cost Explorer | CUR |
|---|---------------|-----|
| UI | yes | no (S3 files) |
| Detail | aggregates | **one row per usage** |
| Analysis | fast | Athena, QuickSight, Kubecost |

CUR → S3 (Parquet) → **Athena**:

```sql
SELECT line_item_product_code,
       SUM(line_item_unblended_cost) AS cost
FROM cur_db.cur_table
WHERE line_item_usage_start_date >= DATE '2026-05-01'
GROUP BY 1
ORDER BY 2 DESC;
```

Queries: “how much did **NAT Gateway** cost per AZ,” “Team tag missing.”

---

## Cost Anomaly Detection

ML baseline by service/account → alert via SNS/Chatbot. Useful for:

- forgotten **EKS cluster**
- **S3 PUT** leak in a loop
- new **NAT** after a lab

Does not replace **budgets** — complements them.

---

## Billing Conductor / Invoice (briefly)

In **Organizations** — consolidated bill, credits, custom line items for resellers. For an engineer it’s enough to know: the **management account** sees all linked accounts.

---

## LocalStack caveat

Budgets/CUR in LocalStack are **limited**. Labs teach **correct Terraform**; numbers — in an [optional-aws](../aws-advanced/optional-aws-advanced.md) dev account.

---

## In mock-exams

- [13-lab-budgets-tags](13-lab-budgets-tags.md)
- [14-lab-cost-report](14-lab-cost-report.md)

---

## Summary

**Explorer** — daily navigation. **Budgets** — guardrails and alerts. **CUR** — forensics and precise reports. Anomaly — insurance against surprises.

---

## Checklist

- [ ] Is a FORECASTED budget set on the dev account?
- [ ] Do you know the top-3 service codes for the month?
- [ ] When do you need CUR instead of Explorer?

**Next:** [05. Rightsizing](05-rightsizing.md).
