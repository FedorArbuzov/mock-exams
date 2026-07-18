# 08. Retention: время, размер, сегменты, compaction

## Введение: «диск Kafka забился за ночь»

Topic `app.logs` без лимита, retention **7 дней** по умолчанию казался достаточным — но объём **терабайт в день**. Брокер остановил приём: `log.dir` заполнен. Retention в Kafka — не «удалить из очереди после чтения», а **политика хранения лога на диске** независимо от consumer.

## Что вы узнаете

- **retention.ms** / **retention.bytes** на topic.
- **Segment**-файлы log и index.
- Разницу **delete** и **compact** policy.
- Когда нужен **log compaction** (обзор).

## Как хранится partition на диске

Каждая partition — каталог на брокере:

```text
orders.events-0/
  00000000000000000000.log
  00000000000000000000.index
  00000000000000000000.timeindex
  ...
```

Записи append в **активный сегмент**. Когда сегмент достигает `segment.bytes` или `segment.ms` — **ротируется**, открывается новый.

Старые сегменты удаляются, когда:

- возраст > **retention.ms**, или
- суммарный размер partition > **retention.bytes** (если задан).

## Delete policy (по умолчанию)

`cleanup.policy=delete` — сегменты старше retention **удаляются**. Consumer, отставший дольше retention, **не догонит** — данные исчезли.

| Параметр topic | Смысл |
|----------------|--------|
| `retention.ms` | сколько хранить (мс) |
| `retention.bytes` | макс. размер partition |
| `segment.ms` | ротация по времени |
| `segment.bytes` | ротация по размеру |

Глобальные default на broker: `log.retention.hours` (часто 168 = 7 дней).

## Compact policy (обзор)

`cleanup.policy=compact` — для topic вроде **changelog**: по каждому key остаётся **последнее** значение.

Примеры: `__consumer_offsets`, Connect offsets, KTable state в Kafka Streams.

Не путать с delete: compact **не** удаляет всё по времени так же — tombstone и `delete.retention.ms` (intermediate).

## Retention vs consumer offset

Consumer может коммитить offset **1000**, а retention удалил записи до **5000** — при `earliest` consumer перепрыгнет на доступное начало.

**Lag** считается от **log end** — если данные удалены, «догнать» невозможно.

## На стенде: посмотреть конфиг topic

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.retention-hint \
  --partitions 1 --replication-factor 1 \
  --config retention.ms=604800000 \
  --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name lab.retention-hint --describe
```

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| Бесконечный retention на логах | full disk | retention.bytes + мониторинг диска |
| Слишком короткий retention для replay | analytics не успели | увеличить ms или tiered storage |
| Compact на event stream без key | непредсказуемо | delete policy |
| Ждать «Kafka удалит после ACK» | путаница с queue | только retention policy |

## В продакшене

- **Tiered storage** (KIP) — холодные сегменты в S3.
- Отдельные cluster/topic для **audit** с длинным retention.
- Алерты: **disk usage**, **log size**.
- Юридические требования (GDPR) — **не** хранить PII в Kafka дольше нужного; compaction не стирает историю версий без tombstone design.

## Резюме

Kafka хранит лог **на диске** по retention, а не «пока не прочитали». Сегменты ротируются и удаляются. **Compact** — для changelog по key; **delete** — для потока событий.

## Чек-лист

- Что удаляется первым при `retention.ms=3600000` (1 час)?
- Consumer отстаёт на 2 дня, retention 1 день — что произойдёт?
- Зачем compact для `__consumer_offsets`?
- Чем segment отличается от topic?

Следующий урок: [09. Лаба: retention](09-lab-retention.md).
