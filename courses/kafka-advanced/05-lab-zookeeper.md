# 05. Лаба: ZooKeeper mode — docker-compose.zk.yml

## Цель лабы

Поднять **legacy** стек Kafka + ZooKeeper из [`deploy/kafka/docker-compose.zk.yml`](../../deploy/kafka/docker-compose.zk.yml), сравнить bootstrap и UI с KRaft профилем, выполнить базовые операции и **корректно остановить** профиль.

## Предварительно

- [04-zookeeper-legacy](04-zookeeper-legacy.md).
- Порты **2181**, **9092**, **8080** свободны.
- Остановите default KRaft, если занят 8080/9094:

```bash
cd deploy/kafka
docker compose down
```

---

## Задание 1. Поднять ZK профиль

```bash
cd deploy/kafka
docker compose -f docker-compose.zk.yml up -d
docker compose -f docker-compose.zk.yml ps
```

**Что увидите:** `mock-zookeeper`, `mock-kafka-zk`, `mock-kafka-ui-zk`.

| Сервис | Порт с хоста |
|--------|----------------|
| ZooKeeper | 2181 |
| Kafka | **9092** (не 9094) |
| Kafka UI | 8080 |

---

## Задание 2. Smoke: list topics

```bash
docker exec mock-kafka-zk kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
```

Если `kafka-topics.sh` не в PATH (образ Confluent):

```bash
docker exec mock-kafka-zk bash -c \
  'kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null || \
   /usr/bin/kafka-topics --bootstrap-server localhost:9092 --list'
```

**Что увидите:** пустой список или служебные topics.

С хоста (kcat):

```bash
kcat -b localhost:9092 -L
```

---

## Задание 3. Создать topic и produce

```bash
docker exec mock-kafka-zk kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.zk.legacy \
  --partitions 3 --replication-factor 1

docker exec -it mock-kafka-zk kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.zk.legacy
```

Введите `msg-1`, `msg-2`, Ctrl+D.

```bash
docker exec mock-kafka-zk kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.zk.legacy --from-beginning --timeout-ms 5000
```

---

## Задание 4. ZK four-letter words (опционально)

```bash
docker exec mock-zookeeper bash -c 'echo ruok | nc localhost 2181'
docker exec mock-zookeeper bash -c 'echo stat | nc localhost 2181'
```

**Что увидите:** `ruok` → `imok`; `stat` — режим `leader`/`follower`, connections.

**На собеседовании:** four-letter words отключайте в prod (`whitelist`).

---

## Задание 5. Сравнение с KRaft (заметки)

Заполните таблицу в тетради:

| | KRaft (`docker compose up`) | ZK (`docker-compose.zk.yml`) |
|--|----------------------------|------------------------------|
| Bootstrap с хоста | 9094 | 9092 |
| Контейнер Kafka | mock-kafka | mock-kafka-zk |
| Третий компонент | нет | ZooKeeper |
| Образ | apache-kafka / bitnami (см. compose) | Confluent cp-kafka |

---

## Задание 6. Остановка и возврат

```bash
docker compose -f docker-compose.zk.yml down
docker compose up -d
```

**Зачем:** следующие лабы advanced/intermediate ожидают KRaft на **9094**.

---

## Критерии успеха

- [ ] Подняли ZK + Kafka, создали topic, прочитали сообщения.
- [ ] Объяснили разницу порта 9092 vs 9094.
- [ ] Остановили ZK профиль, вернули default compose.

## Если не работает

| Симптом | Решение |
|---------|---------|
| Kafka не стартует | `docker compose -f docker-compose.zk.yml logs kafka` — ждать `zookeeper:2181` |
| Port 8080 busy | остановить другой compose |
| `kafka-topics.sh` not found | использовать `kafka-topics` без `.sh` в Confluent image |

**Дальше:** [06-tiered-storage](06-tiered-storage.md).
