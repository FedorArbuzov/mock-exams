# 11. Транзакции и EOS: read_committed

## Введение: «consumer увидел полузаписанный batch»

Transactional producer пишет сообщения в **транзакции**; до **commit** они **невидимы** для `read_committed` consumer. При **abort** — как будто batch не было (для изолированного reader). Это основа **exactly-once** между Kafka-топиками в Streams и в цепочках consume-transform-produce.

## Что вы узнаете

- **transactional.id**, эпохи producer.
- **Commit** / **abort** транзакции.
- **`isolation.level=read_committed`**.
- **Control messages** (transaction markers).
- Transaction log и RF на cluster.
- Ограничения: только Kafka clients с поддержкой API.

---

## Transactional producer

```properties
enable.idempotence=true
transactional.id=my-service-1   # уникален в кластере, стабилен при рестарте
```

Жизненный цикл:

1. `initTransactions()`
2. `beginTransaction()`
3. `send()` …
4. `commitTransaction()` или `abortTransaction()`

**Fence:** новый producer с тем же `transactional.id` «выталкивает» старый — защита от zombie writer после долгого GC pause.

## Что видит consumer

| isolation.level | Поведение |
|-----------------|-----------|
| `read_uncommitted` (default) | все сообщения, в т.ч. open txn |
| `read_committed` | только после commit txn; ждёт open txn до timeout |

Для EOS downstream consumer на «чистый» topic обычно **`read_committed`**.

## Несколько topics

Одна транзакция может писать в **несколько partition** атомарно (в пределах Kafka). Паттерн **consume-transform-produce** в Kafka Streams использует это для EOS.

## Transaction state log

Внутренний topic `__transaction_state` — на cluster compose **RF=3**, **min ISR=2**. Без этого транзакции не переживут отказ брокера.

## read_committed и lag

Consumer может «застрять» на open transaction (producer завис) до `transaction.max.timeout.ms` — операторский риск.

## На стенде (концептуально)

Полноценный transactional produce в `kafka-console-producer` **ограничен**. Лаба 12 — **концепт** + чтение документации и UI; для кода — Java `KafkaProducer` с `transactional.id`.

Пример свойств (справочно):

```properties
transactional.id=lab-txn-1
enable.idempotence=true
acks=all
```

Consumer:

```properties
isolation.level=read_committed
```

## Типичные ошибки

| Ошибка | Причина |
|--------|---------|
| Забыли `read_committed` | consumer видит uncommitted / дубли при abort |
| Меняют `transactional.id` каждый деплой | лишние fence, путаница эпох |
| Транзакции на hot path без нужды | latency, operational complexity |
| Пишут в БД и Kafka без outbox | EOS только в Kafka, не end-to-end |

## В продакшене

- EOS там, где **Kafka Streams** или строгий CTP pipeline.
- Для «Kafka + PostgreSQL» часто **outbox pattern** проще транзакций Kafka.
- Мониторинг: `transaction-coordinator` metrics, aborted transaction rate.

## Резюме

Транзакции Kafka — **изоляция записей в логе**; **read_committed** — фильтр на чтении. End-to-end exactly-once в микросервисах — отдельный инженерный проект.

## Чек-лист

- [ ] Знаете роль `transactional.id`.
- [ ] Объясняете `read_committed` vs `read_uncommitted`.
- [ ] Понимаете fence zombie producer.

**Дальше:** [12. Лаба: read_committed](12-lab-read-committed.md) (концептуальная).
