# 10. Organizations, budgets, политики тегов

## Введение

Один **production account** проще. Реальность — **dev/stage/prod/sandbox**, security tool account, log archive. FinOps без **governance** = leak в sandbox и shock bill.

Связь: [aws-advanced/01–05 Organizations](../aws-advanced/01-organizations.md).

---

## Account strategy

| Паттерн | FinOps эффект |
|---------|---------------|
| Account per environment | blast radius + budget per env |
| Account per team | chargeback нативно |
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

## SCP для cost guardrails

Примеры (иллюстративно):

- Запретить `runinstances` типов > `xlarge` в sandbox OU
- Запретить регионы кроме `eu-central-1`
- Требовать tag keys (через **Tag Policies** + RAM)

Не заменяют **budgets** — предотвращают катастрофу.

---

## Budgets на OU / account

- **Monthly cost budget** на sandbox $500 FORECASTED 80%.
- **Zero spend budget** на closed projects (alert if > $1).

**Budget actions** (AWS): auto IAM policy или SNS — осторожно в prod.

---

## RI/SP management account

Purchasing centralized в **management account** — единый pool discount; allocation reports по linked accounts.

---

## FinOps в Landing Zone

Control Tower / AFT — шаблоны с:

- mandatory tags
- Config rules: `required-tags`
- budget baseline per new account

---

## В mock-exams

[13-lab-budgets-tags](13-lab-budgets-tags.md) — Terraform budget. Organizations — [aws-advanced/02-lab-cross-account](../aws-advanced/02-lab-cross-account.md).

---

## Резюме

Multi-account — **инструмент allocation и blast radius**. SCP + Tag Policies + Budgets = guardrails; CUR на management — единая правда.

---

## Чек-лист

- [ ] Sandbox в отдельном account/OU?
- [ ] Budget FORECASTED на dev?
- [ ] Tag Policies включены в Organizations?

**Дальше:** [11. Процесс и культура](11-process-culture.md).
