# 10. Organizations, budgets, tag policies

## Intro

One **production account** is simpler. Reality — **dev/stage/prod/sandbox**, a security tool account, a log archive. FinOps without **governance** = leak in sandbox and a shock bill.

Related: [aws-advanced/01–05 Organizations](../aws-advanced/01-organizations.md).

---

## Account strategy

| Pattern | FinOps effect |
|---------|---------------|
| Account per environment | blast radius + budget per env |
| Account per team | chargeback natively |
| Central logging account | CUR aggregation |
| Sandbox OU | SCP limits instance types |

```text
Organization
├── OU Production
│   ├── account-prod-app
│   └── account-prod-data
├── OU NonProduction
│   ├── account-dev
│   └── account-stage
└── OU Sandbox (auto cleanup policies)
```

---

## SCP for cost guardrails

Examples (illustrative):

- Deny `runinstances` of types > `xlarge` in the sandbox OU
- Deny regions other than `eu-central-1`
- Require tag keys (via **Tag Policies** + RAM)

They don’t replace **budgets** — they prevent catastrophe.

---

## Budgets on OU / account

- **Monthly cost budget** on sandbox $500 FORECASTED 80%.
- **Zero spend budget** on closed projects (alert if > $1).

**Budget actions** (AWS): auto IAM policy or SNS — use carefully in prod.

---

## RI/SP management account

Centralized purchasing in the **management account** — single discount pool; allocation reports by linked accounts.

---

## FinOps in the Landing Zone

Control Tower / AFT — templates with:

- mandatory tags
- Config rules: `required-tags`
- budget baseline per new account

---

## In mock-exams

[13-lab-budgets-tags](13-lab-budgets-tags.md) — Terraform budget. Organizations — [aws-advanced/02-lab-cross-account](../aws-advanced/02-lab-cross-account.md).

---

## Summary

Multi-account is a tool for **allocation and blast radius**. SCP + Tag Policies + Budgets = guardrails; CUR on management — single source of truth.

---

## Checklist

- [ ] Sandbox in a separate account/OU?
- [ ] FORECASTED budget on dev?
- [ ] Tag Policies enabled in Organizations?

**Next:** [11. Process and culture](11-process-culture.md).
