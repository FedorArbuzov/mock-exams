# FinOps

Курс по **FinOps** и **управлению облачными затратами**: allocation (теги), visibility (Cost Explorer, CUR), **budgets**, **rightsizing**, коммитменты (Savings Plans / RI / Spot), стоимость **EKS/Kubernetes** и **Kubecost**, governance в multi-account. Теория на русском + **две лабы** (LocalStack/Terraform и опционально real AWS dev).

**Для кого:** DevOps / platform / cloud engineer после AWS-трека; SRE, которым нужно связать **error budget** с **cloud bill**; тимлиды, вводящие chargeback/showback.

**Предварительно:**

| Курс | Зачем |
|------|--------|
| [aws-basic](../aws-basic/README.md) | сервисы и биллинг в общих чертах |
| [aws-terraform](../aws-terraform/README.md) | budgets/tags в IaC |
| [aws-intermediate](../aws-intermediate/README.md) | VPC, NAT, RDS, ECS — источники cost |
| [aws-advanced/25–26](../aws-advanced/25-cost-optimization.md) | краткий ввод (здесь — глубже) |

**Полезно:** [kuber-intermediate](../kuber-intermediate/README.md), [observability-advanced/05](../observability-advanced/05-cardinality-cost.md), [sre/15](../sre/15-economics-of-reliability.md).

## Как читать

- Главы **01–12** — теория (~30–50 мин каждая).
- **13–14** — лабы после глав **03–04** и **05–08**.
- **15** — финальный cost review для команды/сервиса.

**Время:** ~**14–18 часов** + **3–4 часа** лаб; финал — **2–3 часа**.

## Программа

### Часть I — Дисциплина и видимость (01–04)

| № | Глава |
|---|--------|
| 01 | [FinOps: роли, цикл Inform → Optimize → Operate](01-intro-finops.md) |
| 02 | [Unit economics, showback и chargeback](02-unit-economics.md) |
| 03 | [Теги, allocation, Cost Categories](03-tagging-allocation.md) |
| 04 | [Cost Explorer, CUR, Budgets, аномалии](04-aws-cost-tools.md) |

### Часть II — Оптимизация ресурсов (05–08)

| № | Глава |
|---|--------|
| 05 | [Rightsizing: EC2, RDS, Lambda](05-rightsizing.md) |
| 06 | [EKS, Fargate, idle capacity](06-kubernetes-cost.md) |
| 07 | [Kubecost и аллокация в Kubernetes](07-kubecost.md) |
| 08 | [S3, EBS, NAT и data transfer](08-storage-network-cost.md) |

### Часть III — Коммитменты и governance (09–11)

| № | Глава |
|---|--------|
| 09 | [Savings Plans, Reserved, Spot](09-commitments.md) |
| 10 | [Organizations, budgets, политики тегов](10-governance.md) |
| 11 | [FinOps в процессе: ритуалы и культура](11-process-culture.md) |

### Часть IV — Практика (12–15)

| № | Глава |
|---|--------|
| 12 | [Стоимость observability и платформы](12-observability-platform-cost.md) |
| 13 | [Лаба: budgets, tags, Terraform](13-lab-budgets-tags.md) |
| 14 | [Лаба: отчёт и rightsizing plan](14-lab-cost-report.md) |
| 15 | [Синтез: cost review и чек-лист](15-synthesis.md) |

## Что должно получиться

- Вводите **обязательные теги** и строите отчёт по team/env/service.
- Настраиваете **Budget** с forecast alert и понимаете CUR vs Explorer.
- Составляете **rightsizing plan** для EC2/RDS/EKS без «выключить всё».
- Объясняете **Kubecost** allocation (namespace, label) на `mockctl`.
- Проводите **monthly cost review** с action items.

## Требования

| Режим | Что нужно |
|-------|-----------|
| Теория | только чтение |
| Лаба 13 | Terraform, [LocalStack](../../deploy/localstack/docker-compose.yml) или AWS dev account |
| Лаба 14 | AWS Cost Explorer (real account) или учебный отчёт по шаблону |
| Kubecost (глава 07) | `mockctl up`, Helm, 4+ ГБ RAM |

**Важно:** учебные account — **budget alert** и **cleanup** после лаб ([aws-advanced/optional-aws](../aws-advanced/optional-aws-advanced.md)).

## Связь с aws-advanced

| aws-advanced | finops |
|--------------|--------|
| [25-cost-optimization](../aws-advanced/25-cost-optimization.md) | обзор → главы 03–04, 09 |
| [26-lab-cost-budgets](../aws-advanced/26-lab-cost-budgets.md) | расширено в [13](13-lab-budgets-tags.md), [14](14-lab-cost-report.md) |

После FinOps логично: [aws-advanced/27](../aws-advanced/27-final-project.md) (enterprise) с cost gate в PRR.
