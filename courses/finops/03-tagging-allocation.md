# 03. Теги, allocation, Cost Categories

## Введение

Без тегов Cost Explorer показывает **Amazon EC2** — $12k. С тегами — **Team=payments** — $4k, из них **Environment=dev** — $1.2k «можно ужать». Теги — **минимальная** инвестиция FinOps.

База в [aws-advanced/25](../aws-advanced/25-cost-optimization.md); здесь — **стратегия и governance**.

---

## Обязательный набор тегов

| Tag | Пример | Зачем |
|-----|--------|-------|
| `Environment` | prod, stage, dev | отделить prod от песочниц |
| `Team` / `Owner` | platform, checkout | chargeback |
| `Service` | image-api | unit cost |
| `CostCenter` | CC-1234 | finance ERP |
| `ManagedBy` | terraform | не трогать руками |

**Конвенция:** lowercase keys, enum values (`prod` не `Prod-PROD`).

---

## Terraform: единый модуль tags

```hcl
locals {
  default_tags = {
    Environment = var.environment
    Team        = var.team
    Service     = var.service_name
    CostCenter  = var.cost_center
    ManagedBy   = "terraform"
  }
}

provider "aws" {
  default_tags {
    tags = local.default_tags
  }
}
```

`default_tags` (AWS provider ≥ 3.0) — меньше забытых ресурсов.

---

## Cost allocation tags

В AWS Console: **Billing → Cost allocation tags** → Activate user-defined tags. Без активации тег **не появится** в отчётах (задержка до 24h).

---

## Cost Categories

Группировка **без** тега на каждом ресурсе:

- по **account** (prod vs sandbox)
- по **service** (все `Amazon RDS`)
- правила: `Environment = dev` OR account id = sandbox

Полезно для **legacy** ресурсов до введения тегов.

---

## Tag Policies (Organizations)

```json
{
  "tags": {
    "Environment": {
      "tag_key": { "@@assign": "Environment" },
      "tag_value": {
        "@@assign": ["dev", "stage", "prod"]
      },
      "enforced_for": { "@@assign": ["ec2:instance", "rds:db"] }
    }
  }
}
```

+ **SCP** «запретить создание EC2 без тега» (опционально, строго).

См. [aws-advanced/03](../aws-advanced/03-scp-governance.md).

---

## Kubernetes labels → cost

Pod без labels = **слепая зона** в Kubecost. Минимум:

```yaml
metadata:
  labels:
    app: checkout-api
    team: payments
    env: prod
```

Связь: [07-kubecost](07-kubecost.md).

---

## Антипаттерны

| Проблема | Решение |
|----------|---------|
| 47 вариантов `env` | enum + policy |
| Теги только на EC2 | default_tags на все сервисы |
| `Name=temp-test` | lifecycle + budget на dev account |

---

## В mock-exams

Лаба: [13-lab-budgets-tags](13-lab-budgets-tags.md). Проект: [image-platform](../aws-intermediate/projects/image-platform/) — добавьте `default_tags`.

---

## Резюме

Теги — **API между engineering и finance**. Cost Categories и policies дожимают дисциплину. K8s без labels дублирует проблему в overlay.

---

## Чек-лист

- [ ] Список обязательных тегов согласован с finance?
- [ ] Activation в Cost allocation включена?
- [ ] Terraform module не допускает пустой `Team`?

**Дальше:** [04. Cost Explorer, CUR, Budgets](04-aws-cost-tools.md).
