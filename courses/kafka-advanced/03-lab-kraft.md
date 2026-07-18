# 03. Лаба: KRaft — metadata, broker API, cluster describe

## Цель лабы

На **KRaft** стенде убедиться, что кластер в режиме **без ZooKeeper**, прочитать **broker / cluster** через CLI, создать topic и связать вывод `describe` с теорией [01-internals](01-internals.md) и [02-kraft](02-kraft.md).

## Предварительно

- [`02-kraft`](02-kraft.md) прочитана.
- Стенд:

```bash
cd deploy/kafka
docker compose up -d
docker compose ps
```

`mock-kafka` → **healthy**. Bootstrap **внутри контейнера:** `localhost:9092`. С хоста: `localhost:9094`.

---

## Задание 1. Проверить отсутствие ZK

**Зачем:** отличить профили compose.

```bash
docker compose ps
docker ps --filter name=zookeeper
```

**Что увидите:** только `mock-kafka`, `mock-kafka-ui` (имена могут отличаться по версии compose). **Нет** `mock-zookeeper`.

Для сравнения позже: [05-lab-zookeeper](05-lab-zookeeper.md) поднимает `docker-compose.zk.yml`.

---

## Задание 2. Broker API versions

**Зачем:** на интервью иногда спрашивают про совместимость клиентов.

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server localhost:9092
```

**Что увидите:** длинный список API keys и min/max versions для брокера `1`.

---

## Задание 3. Cluster ID и describe cluster

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-cluster.sh \
  --bootstrap-server localhost:9092 describe
```

**Что увидите:** `Cluster ID`, список brokers, **controller** node id (часто тот же `1` в single-node).

Зафиксируйте в заметках: **Controller:** `N` — это active controller для metadata.

---

## Задание 4. Topic с RF=1 и log dirs

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.kraft.meta \
  --partitions 3 --replication-factor 1 \
  --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe --topic lab.kraft.meta
```

**Что увидите:** три partition, `Leader: 1`, `Replicas: 1`, `Isr: 1`.

---

## Задание 5. Config source (topic-level)

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name lab.kraft.meta --describe
```

**Что увидите:** inherited broker defaults (retention, compression, …).

Измените retention для практики:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --alter --entity-type topics --entity-name lab.kraft.meta \
  --add-config retention.ms=3600000
```

Повторите `--describe` — появится **DYNAMIC_TOPIC_CONFIG**.

---

## Задание 6. (Опционально) Трёхброкерный KRaft

Если машина ≥ 4 GB RAM:

```bash
docker compose down
docker compose -f docker-compose.cluster.yml up -d
```

Создайте topic `RF=3`:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.kraft.ha \
  --partitions 6 --replication-factor 3

docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.kraft.ha
```

**Что увидите:** leaders распределены по `1/2/3`, ISR по три реплики.

Вернитесь к single-node: `docker compose -f docker-compose.cluster.yml down` и `docker compose up -d`.

---

## Критерии успеха

- [ ] Подтвердили KRaft (нет ZK в default compose).
- [ ] Прочитали `kafka-cluster.sh describe` и node id controller.
- [ ] Создали topic, объяснили строку `Leader` / `Isr`.
- [ ] Изменили dynamic topic config.

## Если не работает

| Симптом | Действие |
|---------|----------|
| Connection refused | `docker compose logs kafka`, дождаться healthy |
| Cluster describe пустой | bootstrap `localhost:9092` **внутри** exec |
| RF=3 ошибка | поднят ли `docker-compose.cluster.yml` |

**Дальше:** [04-zookeeper-legacy](04-zookeeper-legacy.md).
