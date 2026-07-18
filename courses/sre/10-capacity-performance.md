# 10. Ёмкость, производительность и стоимость

## Введение: «в пятницу вдвое больше людей»

Маркетинг запустил акцию без предупреждения. RPS вырос в **3 раза** за час. HPA добавил Pod'ы, но **Postgres connections** уперлись в лимит; **Kafka** lag вырос; **Ingress** стал CPU-throttled. Команда покупает **больше нод**, а узкое место — **один** пул в приложении. SRE должен был **заранее** знать: **headroom**, **лимитирующий ресурс**, **стоимость** следующей девятки.

**Capacity planning** — не «купить серверов», а **прогноз**: хватит ли системы при **пике + запасе** до следующего цикла планирования.

---

## Performance vs capacity

| | Performance | Capacity |
|---|-------------|----------|
| Вопрос | «Насколько быстро при **текущей** нагрузке?» | «Выдержим **больше** нагрузки?» |
| Метрики | latency p99, throughput | headroom, saturation |
| Действие | tuning, indexes | scale out, shard |

Оба связаны: плохая performance при 50% load — **скоро** capacity crisis при 100%.

---

## Модель demand → supply

```text
Demand (RPS, users, data growth)
        │
        ▼
   Service tier (app, cache, queue)
        │
        ▼
   Resource tier (CPU, RAM, disk IOPS, network)
        │
        ▼
   Cost ($)
```

SRE строит **capacity plan** на critical path ([глава 03](03-sli-slo-sla.md) CUJ).

---

## Load testing

| Тип | Цель |
|-----|------|
| **Load** | expected peak + margin |
| **Stress** | найти breaking point |
| **Soak** | утечки за 24–72h |
| **Spike** | внезапный x2 RPS |

**До продакшена:** на staging с **реалистичными** данными; **в проде** — только с guardrails и окном (редко).

Инструменты: k6, Locust, Gatling; для K8s — [kuber-intermediate/17-hpa](../kuber-intermediate/17-hpa.md).

---

## Headroom и N+1

| Концепт | Правило (ориентир) |
|---------|-------------------|
| **Headroom** | 30–50% запаса CPU/RPS на пик |
| **N+1** | потеря одного node/AZ не ломает SLO |
| **Overcommit** | в K8s — осознанно, с limits |

**Saturation** ([USE](02-reliability-and-risk.md)): очередь растёт → latency растёт **до** CPU 100%.

---

## Масштабирование

| Направление | Когда | Пример |
|-------------|-------|--------|
| **Vertical** | быстрый fix, DB | больше RAM RDS |
| **Horizontal** | stateless app | HPA, replicas |
| **Sharding** | data limit | partition by user_id |
| **Async** | burst absorb | queue ([kafka](../kafka-basic/README.md)) |

**Stateful** сложнее: [postgresql-intermediate](../postgresql-intermediate/README.md) replication, connection pooler.

---

## Seasonality и прогноз

| Источник роста | Планирование |
|----------------|--------------|
| Маркетинг | календарь кампаний |
| Organic | trend 90d RPS |
| Новый регион | multiplier users |
| Релиз фичи | dev estimate + canary metrics |

**Ежеквартальный** capacity review: факт vs прогноз, корректировка закупок.

---

## Cost of reliability

Каждая реплика, AZ, standby — **деньги**. [Глава 15](15-economics-of-reliability.md) углубляет trade-off. Capacity без cost — **переразмерение**.

| Решение | Cost driver |
|---------|-------------|
| Multi-region active-active | 2×+ infra |
| Over-provisioned RDS | idle CPU bill |
| Retention logs 365d | storage |

**FinOps** партнёрство: tagging, rightsizing, committed use.

---

## Ёмкость зависимостей

| Dependency | Риск |
|------------|------|
| SaaS API | vendor limits |
| Cloud quota | API rate, IP limits |
| Certificate expiry | не capacity, но outage |
| License | seats, throughput tier |

Runbook: «запросить quota increase за N недель до launch».

---

## В mock-exams

| Тема | Курс |
|------|------|
| HPA | [kuber-intermediate/17](../kuber-intermediate/17-hpa.md) |
| Redis memory | [redis-intermediate](../redis-intermediate/README.md) |
| Kafka partitions | [kafka-intermediate](../kafka-intermediate/README.md) |
| Postgres | [postgresql-performance](../postgresql-performance/README.md) |

---

## Чек-лист

- [ ] Знаете peak RPS за 90 дней?
- [ ] Load test перед крупной акцией?
- [ ] Лимитирующий ресурс назван (не «всё»)?
- [ ] Headroom на AZ failure?

**Дальше:** [11. Изменения как главный риск](11-change-and-release.md).
