# 12. Лаба: read_committed (концептуальная)

## Цель лабы

Без обязательного Java-кода понять **контракт** transactional write и **`isolation.level=read_committed`**: что происходит при open / commit / abort транзакции и как это проверить на стенде через **документацию**, **внутренние topics** и (опционально) sample-приложение.

## Предварительно

- [11. Транзакции](11-transactions-eos.md).
- Кластер запущен.

> **Примечание:** `kafka-console-producer` не предназначен для полноценных транзакций. Лаба — **операторское и архитектурное** понимание; при желании воспроизведите в маленьком Java main с `KafkaProducer`.

---

## Задание 1. Внутренние topics транзакций

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 --list | grep -E 'transaction|__transaction'
```

**Что увидите:** `__transaction_state` (имя может слегка отличаться по версии) — RF=3 на cluster.

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic __transaction_state 2>/dev/null | head -5
```

---

## Задание 2. Таблица сценариев (письменно)

Заполните для себя:

| Шаг | Producer | Consumer `read_uncommitted` | Consumer `read_committed` |
|-----|----------|---------------------------|---------------------------|
| begin + send, txn open | — | видит? | видит? |
| commit txn | — | | |
| begin + send + **abort** | — | | |

**Ответы:** open — uncommitted видит uncommitted reader; committed — только после commit; abort — committed reader не видит aborted batch.

---

## Задание 3. Свойства клиента (чеклист)

Скопируйте в `txn-notes.md` минимальный набор:

**Producer**

```properties
enable.idempotence=true
acks=all
transactional.id=lab-read-committed-1
```

**Consumer**

```properties
isolation.level=read_committed
enable.auto.commit=false
```

---

## Задание 4. (Опционально) Java mini-demo

Псевдокод этапов:

1. Создать topic `lab.txn.demo` RF=3.
2. Producer: `initTransactions`, `beginTransaction`, send 2 records, **не** commit.
3. Consumer A `read_uncommitted` — видит 2 records.
4. Consumer B `read_committed` — **не** видит (или ждёт).
5. `commitTransaction` — B после poll видит 2.
6. Новая txn + `abortTransaction` — B не видит aborted.

---

## Задание 5. Kafka UI

Consumer Groups → при наличии transactional consumer смотрите lag. Topics → `lab.txn.demo` — сообщения появляются после commit.

---

## Задание 6. Связь с EOS

В 5 предложениях: почему **idempotent producer** необходим, но **недостаточен** для «atomic read-process-write» без **транзакции** или **Streams**.

---

## Критерии успеха

- [ ] Нашли **transaction state** topic на кластере.
- [ ] Заполнили таблицу сценариев open/commit/abort.
- [ ] Перечислили producer/consumer properties для read_committed.
- [ ] Объяснили границу EOS **внутри Kafka** vs внешняя БД.

**Дальше:** [13. Schema Registry](13-schema-registry.md) — стенд переключите на [`docker-compose.extras.yml`](../../deploy/kafka/docker-compose.extras.yml).
