# Kafka для курсов kafka-*

Локальный стенд для [kafka-basic](../../courses/kafka-basic/README.md), [kafka-intermediate](../../courses/kafka-intermediate/README.md), [kafka-advanced](../../courses/kafka-advanced/README.md).

## Запуск (один брокер KRaft)

```bash
cd deploy/kafka
docker compose up -d
docker compose ps
```

| Сервис | URL / порт |
|--------|------------|
| Kafka (с хоста) | `localhost:9094` |
| Kafka (из Docker) | `kafka:9092` |
| Kafka UI | [http://localhost:8080](http://localhost:8080) |

Дождитесь `healthy` у контейнера `mock-kafka` (30–60 с).

## Smoke test

```bash
bash scripts/smoke.sh
# Windows (PowerShell):
# .\scripts\smoke.ps1
# или вручную:
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
```

## CLI внутри контейнера

```bash
docker exec -it mock-kafka bash
export BS=localhost:9092

kafka-topics.sh --bootstrap-server $BS --list
kafka-console-producer.sh --bootstrap-server $BS --topic demo
kafka-console-consumer.sh --bootstrap-server $BS --topic demo --from-beginning
kafka-consumer-groups.sh --bootstrap-server $BS --list
```

С **хоста** (если установлен Kafka client или kcat):

```bash
kcat -b localhost:9094 -L
kcat -b localhost:9094 -t demo -P
kcat -b localhost:9094 -t demo -C -o beginning
```

## Кластер из 3 брокеров (intermediate)

```bash
docker compose -f docker-compose.cluster.yml up -d
# bootstrap с хоста: localhost:9091,9092,9093
```

Создание topic с RF=3:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic orders --partitions 6 --replication-factor 3
```

## Schema Registry + Connect (intermediate)

```bash
docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d
```

| Сервис | Порт |
|--------|------|
| Schema Registry | 8081 |
| Connect REST | 8083 |

## Zookeeper mode (advanced, legacy)

```bash
docker compose -f docker-compose.zk.yml up -d
# bootstrap: localhost:9092
```

## Остановка

```bash
docker compose down
docker compose -f docker-compose.cluster.yml down
```

## Типичные проблемы

| Симптом | Решение |
|---------|---------|
| Connection refused на 9094 | дождаться healthcheck; `docker compose logs kafka` |
| Consumer не видит сообщения | другой `group.id`, `--from-beginning` |
| Not enough replicas | в cluster mode создавайте topic с RF≤3 и min ISR |
| UI пустой | bootstrap `kafka:9092` внутри сети compose |

## Требования

- Docker Desktop / Engine 4 GB+ RAM для cluster overlay
- Порты свободны: 8080, 9091–9094 (зависит от профиля)
