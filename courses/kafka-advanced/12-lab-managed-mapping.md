# 12. Лаба: MSK vs Confluent — сравнительная таблица (упражнение)

## Цель лабы

Заполнить **матрицу решений** для вымышленного кейса (как на system design round). Нет облачного аккаунта — работаем на бумаге/в Markdown. Результат — аргументированная рекомендация за 30 минут.

## Предварительно

- [11-managed-kafka](11-managed-kafka.md).
- Прочитайте требования кейса ниже.

---

## Кейс: «Marketplace EU»

| Требование | Значение |
|------------|----------|
| Cloud | AWS only (eu-central-1, eu-west-1) |
| Peak ingress | 120 MB/s |
| Retention | 30 дней, ~50 TB logical |
| Consumers | 40 microservices (Java), 5 Flink jobs |
| Compliance | GDPR, данные в EU |
| Team | 2 platform engineers |
| DR | RPO 15 min, RTO 2 h |
| Budget | средний, не unlimited |
| Schema | Avro + Registry обязателен |
| SQL analytics | желательно, не blocker |

---

## Задание 1. Таблица критериев

Скопируйте и заполните (✓ / ~ / ✗ или 1–5):

| Критерий | MSK | Confluent Cloud | Strimzi on EKS |
|----------|-----|-----------------|----------------|
| Time to prod (2 FTE) | | | |
| EU data residency | | | |
| IAM auth for apps | | | |
| Managed Connect | | | |
| Schema Registry | | | |
| ksql / Flink hosting | | | |
| Multi-region DR | | | |
| Predictable cost | | | |
| Ops at 120 MB/s | | | |
| Upgrade Kafka version | | | |

**Эталонные заметки (не подглядывать до заполнения):**

- MSK: сильный IAM, Registry через Confluent partner или self-run CP Schema Registry on ECS — уточните в ответе.
- Confluent: Registry + ksql из коробки, PrivateLink между регионами.
- Strimzi: 2 FTE на 120 MB/s — **риск** без 24/7 SRE.

---

## Задание 2. Выбор и one-pager

Напишите **½ страницы**:

1. Рекомендация (один primary, один fallback).
2. Три **риска** и mitigation.
3. Bootstrap и auth схема (1 diagram ascii).

Пример начала:

```text
Рекомендуем MSK Provisioned в eu-central-1 primary + MM2 в eu-west-1 DR...
```

---

## Задание 3. Вопросы интервьюеру

Составьте **5 уточняющих вопросов**, которые вы задали бы product до выбора:

- нужен ли active-active writes в оба региона?
- допустим ли vendor Confluent?
- есть ли уже EKS cluster?

---

## Задание 4. Self-check rubric

| Балл | Критерий |
|------|----------|
| 1 | Таблица заполнена без пустых строк |
| 1 | Учтены RPO/RTO (MM2 / Cluster Linking) |
| 1 | Упомянут cross-AZ cost |
| 1 | Schema Registry не «забыт» |
| 1 | Честно оценён staffing (2 FTE) |

---

## Пример эталонного вывода (сверка)

**Primary: MSK Provisioned** + **Glue Schema Registry** или **Confluent Schema Registry hosted** + **Flink on EMR/EKS** для тяжёлой аналитики.

**Fallback: Confluent Cloud** если покупка ksql + governance быстрее чем найм Flink ops.

**Не Strimzi** при 2 FTE unless команда отказывается от managed — аргументируйте.

---

## Критерии успеха

- [ ] Таблица заполнена самостоятельно.
- [ ] One-pager с рисками.
- [ ] 5 вопросов product.

**Дальше:** [13-security-advanced](13-security-advanced.md).
