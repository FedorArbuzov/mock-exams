# 13. Надёжность: очереди, BLPOP, at-least-once

## Введение: «задача исчезла — воркер упал после POP»

Очередь на `LPUSH` / `RPOP` проста, но `RPOP` **удаляет** задачу сразу. Воркер взял задачу и упал — работа **потеряна**. Паттерн **BLPOP** + **processing list** (или Streams с `XACK`) даёт **at-least-once**: задача либо выполнена, либо вернётся в очередь.

## Что вы узнаете

- List-based queue: `LPUSH` + `BRPOP` / `BLPOP`.
- Reliable queue: `RPOPLPUSH` / `BRPOPLPUSH` (legacy) и двухсписочная схема.
- **At-least-once**, идемпотентность, visibility timeout.
- Когда List, когда Streams ([07](07-streams.md)).

## Простая очередь (fire-and-forget)

```text
Producer: LPUSH queue:tasks "{id:1,payload:...}"
Worker:   BRPOP queue:tasks 0
```

Плюс: просто. Минус: после `BRPOP` сообщение **вне** Redis — crash = потеря.

## Reliable queue (два списка)

```text
queue:pending     — новые задачи
queue:processing  — взятые воркером
```

Атомарно (Redis 6.2+ `LMOVE`, раньше `RPOPLPUSH`):

```bash
LMOVE queue:pending queue:processing RIGHT LEFT
```

После успеха:

```bash
LREM queue:processing 1 <task-json>
```

При падении воркера — **reaper**: переносит старые записи из `processing` обратно в `pending` (по timestamp в payload или отдельный ZSET heartbeat).

## BLPOP — блокирующее ожидание

```bash
BLPOP queue:tasks 5
```

Ждёт до 5 секунд; подходит для пула воркеров без busy-loop.

## At-least-once и дубли

| Гарантия | Поведение |
|----------|-----------|
| At-most-once | потеря возможна |
| At-least-once | дубли возможны |
| Exactly-once | сложно; idempotency key в БД |

Воркер должен обрабатывать `taskId` **идемпотентно** (`INSERT ... ON CONFLICT`).

## Streams vs List

| | List + LMOVE | Streams |
|--|--------------|---------|
| Сложность | низкая | средняя |
| ACK / pending | вручную | встроено PEL |
| Несколько consumer | конкурируют BRPOP | consumer group |
| Replay | сложнее | `XRANGE` |

Для курса intermediate — оба паттерна; лаба 14 — **List**.

## На стенде

```bash
docker exec mock-redis redis-cli DEL queue:pending queue:processing
docker exec mock-redis redis-cli LPUSH queue:pending '{"id":"t1"}'
```

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| Задачи дублируются | retry без idempotency | ключ `processed:t1` |
| Задачи теряются | только RPOP | pending/processing |
| Очередь «зависла» | poison message | DLQ list, max retry |
| Блокировка всего Redis | огромный payload | лимит размера, S3 для тела |
| Порядок нарушен | много воркеров | один shard или Streams |

## В продакшене

- Метрики: длина `pending`, `processing`, age oldest.
- DLQ: `queue:dead` после N попыток.
- Для тяжёлых pipeline — Kafka/Rabbit; Redis — **короткие** задачи.
- Не использовать Redis как **единственное** хранилище критичных данных без AOF/replication.

## Резюме

Надёжная очередь в Redis — атомарный перенос в processing + ACK + reaper. Гарантия — at-least-once; бизнес-логика — идемпотентная.

## Чек-лист

- Почему `BRPOP` alone не надёжен?
- Что делает `LMOVE` между списками?
- Как обнаружить «зависшие» задачи?
- Когда выбрать Streams вместо List?

Следующий урок: [14. Лаба: BLPOP queue](14-lab-blpop-queue.md).
