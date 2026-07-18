# 02. Unit economics, showback и chargeback

## Введение

«AWS вырос на 30%» — плохой headline. «**Cost per order** вырос на 5% из‑за пика NAT» — решение для product и platform. **Unit economics** переводит инфраструктуру в язык бизнеса.

---

## Unit cost

```text
Unit cost = Total cloud cost (allocated) / Business unit
```

Примеры **unit**:

| Продукт | Unit |
|---------|------|
| E-commerce | $ / заказ, $ / 1000 checkout |
| SaaS API | $ / 1M requests |
| Data platform | $ / TB processed |
| Internal platform | $ / developer / month |

Без unit finance видит только **aggregate**; engineering не видит **эффект** оптимизации.

---

## Showback vs chargeback

| | Showback | Chargeback |
|---|----------|------------|
| Счёт команде | отчёт «как если бы платили» | реальное списание с P&L |
| Мотивация | прозрачность | сильнее |
| Сложность | ниже | нужен finance process |

**Showback** — хороший старт для mock-exams и учебных account: команды **видят** цифру без бухгалтерии.

---

## Allocation без идеальных тегов

1. **Прямые** теги — EC2 с `Team=checkout`.
2. **Пропорция** — shared ALB делится по % трафика (метрики).
3. **Amortized** — Support plan, Organizations fee — по headcount.

Доля **unallocated** должна **снижаться** (<5–10% цель).

---

## Marginal cost релиза

Новая фича → новые ресурсы:

| Вопрос на design review |
|------------------------|
| +сколько $/month при 10k RPS? |
| Нужен ли always-on NAT или VPC endpoint? |
| Кэш снизит RDS на X%? |

Связь с [sre/14-production-readiness](../sre/14-production-readiness.md) — PRR может включать **cost estimate**.

---

## В mock-exams

Учебный [image-platform](../aws-intermediate/projects/image-platform/) — посчитайте unit «$ / 1000 uploads» после лаб (шаблон в [14-lab-cost-report](14-lab-cost-report.md)).

---

## Резюме

FinOps зрелость = от **«сколько всего»** к **«сколько на единицу ценности»**. Showback учит команды; chargeback закрепляет ответственность.

---

## Чек-лист

- [ ] Выберите unit для вашего основного сервиса.
- [ ] Оцените % unallocated cost сегодня.
- [ ] Один shared ресурс — как бы вы разделили?

**Дальше:** [03. Теги и allocation](03-tagging-allocation.md).
