# 11. Гибридные схемы и миграции

## Введение

Зрелые компании редко «только Kafka». Чаще — **слои**: log для фактов, queue для задач, Redis для кэша и лёгких jobs.

---

## Типовые гибриды

### Kafka + SQS

```text
Kafka (orders.events) ──► connector/λ ──► SQS ──► legacy worker
```

Legacy не читает Kafka; adapter переводит модель.

### Rabbit + Kafka

```text
Monolith (Rabbit tasks) ──outbox/bridge──► Kafka (new services)
```

Постепенная миграция домена.

### Redis Streams + Kafka

Короткие **real-time** уведомления в Redis; **canonical** log в Kafka.

**Антипаттерн:** два source of truth без sync.

---

## EventBridge + MSK

```text
AWS services → EventBridge → Lambda → MSK topic
App → MSK (primary analytics)
```

EventBridge для **cloud native**; MSK для **heavy** consumers.

---

## Выбор primary bus

| Критерий | Решение |
|----------|---------|
| Source of truth для «что случилось» | один primary log |
| Task execution | queue (SQS/Rabbit) |
| Integration glue | EventBridge |

Документируйте в **ADR**.

---

## Strangler migration

1. Новые события → Kafka.
2. Старый consumer Rabbit **dual-read** (флаг).
3. Отключить Rabbit path.
4. Decommission exchange.

---

## Резюме

Гибрид — **норма**; хаос — **два primary log** без владельца.

---

## Чек-лист

- [ ] Где canonical event store?
- [ ] Есть ли bridge с мониторингом lag?
- [ ] План отключения legacy broker?

**Дальше:** [12. System design](12-system-design.md).
