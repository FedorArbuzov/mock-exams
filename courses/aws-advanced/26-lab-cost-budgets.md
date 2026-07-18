# 26. Лаба: budget и cost report

Краткая лаба в рамках aws-advanced. **Полный трек:** [finops/README.md](../finops/README.md) — [13-lab-budgets-tags](../finops/13-lab-budgets-tags.md), [14-lab-cost-report](../finops/14-lab-cost-report.md).

## Задание 1. Tag policy (Organizations)

Требовать tags `Environment`, `Team` на ресурсы (SCP или Tag Policies).

## Задание 2. Budget

Terraform из [25-cost-optimization.md](25-cost-optimization.md) — email alert 80% forecast.

## Задание 3. Cost Explorer

Console → Cost Explorer → Group by **Service** за последние 7 дней. Найдите топ-3 после EKS лабы.

## Задание 4. Отчёт в README

Таблица:

| Сервис | $ | Рекомендация |
|---|---|---|
| EC2 | | rightsizing |
| NAT | | удалить после лабы |

## Задание 5. Cleanup checklist

Скрипт или чеклист из [optional-aws-advanced.md](optional-aws-advanced.md).

## Критерии успеха

- [ ] Budget создан
- [ ] Все учебные ресурсы tagged
- [ ] Отчёт + cleanup выполнен

Следующий урок: [27-final-project.md](27-final-project.md).
