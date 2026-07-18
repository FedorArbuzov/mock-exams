# 04. Producer: key, partition, acks

## Введение: «платёж ушёл дважды»

Сервис отправил `payment.captured` в Kafka, получил timeout, **повторил** send — в topic два одинаковых события. Consumer без **idempotency** списал деньги дважды. Producer в Kafka настраивают не только «куда писать», но и **насколько ждать подтверждения** от брокера (**acks**) и **как** маршрутизировать по partition (**key**).

## Что вы узнаете

- Параметры **key**, **partition** (явная), **headers**.
- Семантика **acks** (`0`, `1`, `all`).
- **Retries**, **batching**, **compression** (обзор).
- Связь key → partition → порядок.

## Запись в лог

Producer отправляет **Record**:

| Поле | Назначение |
|------|------------|
| **key** | маршрутизация; `null` → round-robin |
| **value** | payload (bytes; часто JSON/Avro) |
| **headers** | метаданные (trace-id, content-type) |
| **timestamp** | CreateTime или LogAppendTime |
| **partition** | опционально задать вручную (редко) |

## Key и partition

```text
partition = murmur2(key) % numPartitions   (если key задан)
```

Один и тот же key → **одна** partition → **порядок** событий с этим key.

**Когда key не нужен:** метрики, логи без связности — больше равномерная нагрузка по partition.

**Когда key обязателен:** заказ, пользователь, счёт — всё по одному агрегату.

## acks — сколько ждать подтверждения

| acks | Значение | Latency | Durability |
|------|----------|---------|------------|
| **0** | fire-and-forget | низкая | низкая (можно потерять) |
| **1** | leader записал | средняя | средняя (падение leader до репликации — риск) |
| **all** / **-1** | все ISR подтвердили | выше | выше (при min.insync.replicas) |

На учебном стенде с **RF=1** разница между `1` и `all` минимальна; в кластере с RF=3 — критична.

Связанные настройки (intermediate):

- `min.insync.replicas` на broker
- `enable.idempotence=true` на producer — защита от дублей при retry

## Batching и linger

Producer **не** шлёт каждую запись отдельным TCP-пакетом:

- `batch.size` — размер batch в байтах
- `linger.ms` — подождать N мс, чтобы наполнить batch

Выше throughput, чуть выше latency.

## Compression

`compression.type`: `none`, `gzip`, `lz4`, `zstd`, `snappy`. Меньше сеть и диск, CPU на broker/клиенте.

## На стенде: producer с key в CLI

Создайте topic:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.keys --partitions 3 --replication-factor 1 \
  --if-not-exists
```

Отправка с key (property parser):

```bash
printf 'order-A|event one\norder-A|event two\norder-B|event three\n' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.keys \
  --property parse.key=true \
  --property key.separator='|'
```

Проверка partition:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.keys \
  --from-beginning \
  --property print.key=true \
  --property print.partition=true \
  --timeout-ms 5000
```

`order-A` — одна partition; `order-B` — возможно другая.

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| Нет key для связанных событий | нарушение порядка | key = business id |
| `acks=0` для денег | потеря при сбое | `all` + idempotence |
| Огромные сообщения (> `message.max.bytes`) | RecordTooLargeException | уменьшить payload, ссылка на S3 |
| Синхронный send в цикле без batch | низкий RPS | async + batch |
| Random key на каждый send | hot partition при skew | соль + hash или другой дизайн |

## В продакшене

- Producer metrics: **record-send-rate**, **request-latency**, **errors**.
- **Dead letter topic** для poison messages (паттерн в consumer).
- Версионирование схем через **Schema Registry** — [10. Сериализация](10-serialization.md).
- Tracing: header `traceparent` из OpenTelemetry.

## Резюме

**Key** задаёт partition и порядок. **acks** балансирует скорость и надёжность. Batching и compression — про эффективность. Дубликаты при retry лечат **idempotent producer** и **идемпотентные** consumer.

## Чек-лист

- Куда попадёт запись без key в topic с 5 partition?
- Чем `acks=all` отличается от `acks=1` при RF=3?
- Зачем один key на все события заказа?
- Что такое ISR одной фразой?

Следующий урок: [05. Лаба: producer и kcat](05-lab-producer.md).
