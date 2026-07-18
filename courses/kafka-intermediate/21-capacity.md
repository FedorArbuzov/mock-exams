# 21. Ёмкость: partition, throughput, hot keys

## Введение: «увеличили partition — стало хуже»

Добавили partition с 6 до 48 «для скорости», а p99 вырос: больше файловых дескрипторов, тяжелее rebalance, **один горячий key** всё равно грузит одну partition. Capacity planning для Kafka — не линейное «больше partition = быстрее».

## Что вы узнаете

- Как **partition** влияет на параллелизм consumer.
- **Hot partition** / hot key.
- Throughput: **batch**, **compression**, **disk**, **network**.
- Верхние границы partition на кластер (порядок величин).
- Когда **увеличивать brokers**, а не partitions.

---

## Partition и параллелизм

Максимум consumer в группе, реально работающих = **число partition** topic (на этот topic).

| Partitions | Consumers (макс. полезных) |
|------------|----------------------------|
| 6 | 6 |
| 6 | 10 → 4 idle |

**Правило:** partition ≥ пиковый параллелизм consumer; не делайте 1000 без нужды.

## Hot key

Один key (`userId=1` celebrity) → **одна** partition → disk и CPU на одном broker выше.

Симптомы:

- Lag только на **partition N**.
- Leader broker N — высокий **BytesInPerSec** на topic.

Митигации:

- Сменить key (добавить salt, sub-key) — ломает порядок по сущности.
- **Burst** в отдельный topic.
- Асинхронная агрегация.

## Broker limits (ориентиры)

Зависят от железа; для планирования:

- Десятки TB на кластер — норма с tiered storage (advanced).
- **Partition count** на кластер: тысячи — ок, десятки тысяч — нужен расчёт.
- `num.network.threads`, `num.io.threads` — tuning под нагрузку.

## Disk

Sequential write — сила Kafka; **random read** при catch-up consumer нагружает disk.

- `retention.ms` / `retention.bytes` — размер.
- **Compression** на producer — меньше IO.

## Network

Cross-AZ traffic при RF=3: каждая запись реплицируется **между AZ** — считайте **×2–3** трафика.

## Producer vs consumer bound

| Узкое место | Признак |
|-------------|---------|
| Producer | broker `RequestHandler` busy, мало consumer lag |
| Consumer | lag растёт, broker idle |
| Disk | high IO wait, slow fetch |

## На стенде

Лаба [22](22-lab-hot-partition.md) — skew по key.

## Типичные ошибки

| Ошибка | Причина |
|--------|---------|
| partition = 1 на high load | нет параллелизма |
| partition = 1000 «на вырост» | rebalance/coordinator overhead |
| Игнор hot key | scale consumer не помогает |
| RF=3 без сетевого бюджета | счета cloud |

## В продакшене

- Load test (kafka-producer-perf-test / end-to-end).
- Dashboard skew: max(partition size) / avg.
- Политика: новый topic — обоснование partition count.

## Резюме

Ёмкость — баланс **partition, keys, brokers, disk**; hot partition лечится **дизайном key**, не только железом.

## Чек-лист

- [ ] Связали partition count и consumer parallelism.
- [ ] Объяснили hot key.
- [ ] Назвали RF и сетевой множитель.

**Дальше:** [22. Лаба: hot partition](22-lab-hot-partition.md).
