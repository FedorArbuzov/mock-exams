# 07. Redis: Pub/Sub, Lists, Streams

## Введение

Redis — **in-memory data store**; messaging — **вторичная** роль. Ошибка: «у нас уже Redis — сделаем всю шину на Pub/Sub».

[redis-basic/16](../redis-basic/16-vs-memcached-kafka.md), [redis-intermediate/13](../redis-intermediate/13-reliability.md).

---

## Три механизма

| Механизм | Модель | Persistence | Replay |
|----------|--------|---------------|--------|
| **Pub/Sub** | broadcast | нет | нет |
| **List** (LPUSH/BRPOP) | simple queue | если AOF/RDB | нет backlog для offline |
| **Streams** (XADD/XREADGROUP) | log-like | да | да, ограниченно |

---

## Pub/Sub — когда

- live notifications UI;
- cache invalidation broadcast;
- **потеря** при offline consumer **допустима**.

**Не для:** billing, платежи, audit.

---

## Lists — когда

- простая job queue **внутри** monolith;
- короткие задачи, один тип worker;
- умеренный volume.

**Риск:** нет DLQ из коробки, blocking на одном Redis.

---

## Streams — когда

- уже Redis в стеке;
- **умеренный** event volume;
- consumer groups, pending, XACK;
- не нужен Kafka ops.

**Не для:** multi-TB retention, Flink ecosystem.

```text
XADD orders * field value
XREADGROUP GROUP billing consumer1 COUNT 10 STREAMS orders >
```

---

## Redis vs Kafka (кратко)

| | Redis Streams | Kafka |
|---|---------------|-------|
| Retention | memory + maxlen | disk, большие |
| Ecosystem | ограничен | огромный |
| Ops | один Redis/Cluster | KRaft cluster |
| Latency | очень низкая | низкая |

---

## Резюме

Redis messaging — **вспомогательный**. Кэш остаётся главным; Streams — **малый** event bus, не замена MSK.

---

## Чек-лист

- [ ] Pub/Sub или Streams для вашего кейса?
- [ ] maxlen на stream настроен?
- [ ] Потеря сообщений при restart consumer допустима?

**Дальше:** [08. AWS EventBridge](08-aws-eventing.md).
