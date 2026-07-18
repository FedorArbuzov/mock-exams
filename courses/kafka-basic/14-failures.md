# 14. Сбои: rebalance, дубликаты, consumer lag

## Введение: «после деплоя lag 2 миллиона»

Ночной релиз добавил pod consumer-ов. Утром **lag** на topic `payments.events` — 2M сообщений, алерт горит, CFO спрашивает про задержку отчётов. Причины: **rebalance storm**, **медленная обработка**, **нехватка partition**, или consumer **упал** без commit. Basic-курс закрывает **диагностику симптомов**, не все лекарства.

## Что вы узнаете

- **Rebalance**: когда случается и почему болит.
- **Дубликаты** при at-least-once.
- **Consumer lag**: определение и где смотреть.
- Первые шаги remediation.

## Rebalance

**Rebalance** — перераспределение partition между consumer в группе.

Триггеры:

- join/leave consumer;
- session timeout (consumer не poll/heartbeat);
- изменение metadata topic (новая partition);
- subscription change.

Симптомы:

- всплеск **stop-the-world** (старые consumer);
- кратковременный **рост lag** на всех partition;
- дубли при commit **после** rebalance (обработка повторилась).

Смягчение (intermediate+):

- `cooperative-sticky` assignor;
- увеличить `session.timeout` / уменьшить время обработки batch;
- **static membership** (`group.instance.id`).

## Дубликаты

Цепочка at-least-once:

1. Consumer обработал сообщение.
2. Упал **до** commit.
3. Новый consumer читает с **последнего committed** offset → **повтор**.

Лечение на уровне приложения:

- **idempotency key** = `eventId`;
- уникальный индекс в БД;
- **upsert** вместо blind insert.

Producer retry без idempotence → **два** одинаковых сообщения в логе — тоже дубли.

## Consumer lag

```text
lag(partition) = log_end_offset - committed_offset
```

| Lag | Интерпретация |
|-----|----------------|
| 0 | consumer успевает |
| растёт | consumer медленнее produce |
| скачок | rebalance, deploy, pause |
| ∞ (нет commit) | consumer не работает / не в группе |

Где смотреть:

- `kafka-consumer-groups.sh --describe`
- Kafka UI [http://localhost:8080](http://localhost:8080)
- Prometheus: `kafka.consumer.lag` (burrow, kafka-exporter)

## Другие сбои (обзор)

| Симптом | Возможная причина |
|---------|------------------|
| `NotLeaderForPartition` | rolling restart broker |
| `RecordTooLarge` | payload > limit |
| Consumer не читает | подписка не на тот topic, ACL |
| Offset out of range | retention удалил данные |

## На стенде: искусственный lag

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.lag-demo --partitions 1 --replication-factor 1 --if-not-exists

for i in $(seq 1 50); do echo "m-$i" | docker exec -i mock-kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic lab.lag-demo; done
```

Запустите consumer **без** завершения, но **медленно** не получится в console — для лабы [15](15-lab-lag.md) используйте UI и группу, которая **не** читает.

Проверка lag без consumer:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group ghost --describe 2>/dev/null || true
```

Создайте группу, прочитайте 10 сообщений и остановите — lag останется:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.lag-demo \
  --group partial-reader \
  --max-messages 10 \
  --timeout-ms 15000

docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group partial-reader --describe
```

**Что увидите:** `LAG` > 0 на partition 0.

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| Commit до записи в БД | потеря при crash |
| Commit после БД, crash до commit | дубль |
| 10 consumer на 2 partition | 8 idle, lag не падает |
| Игнорировать lag alert | часы отставания analytics |
| Reset offsets на prod без runbook | переобработка/потеря |

## В продакшене

- SLO на **max lag** по критичным consumer.
- **Canary deploy** consumer; limit max poll records при релизе.
- Runbook: scale consumers → проверить partition count → профилировать handler.
- **DLQ** + алерт на рост DLQ rate.

## Резюме

**Rebalance** перераспределяет partition и может вызвать паузу и дубли. **Lag** — главный индикатор отставания. **Дубликаты** — нормальная цена at-least-once без идемпотентности.

## Чек-лист

- Формула lag?
- Почему после рестарта consumer возможны дубли?
- Поможет ли 20 pod при 4 partition?
- Где в UI посмотреть lag?

Следующий урок: [15. Лаба: lag в UI](15-lab-lag.md).
