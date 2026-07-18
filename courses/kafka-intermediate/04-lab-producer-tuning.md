# 04. Лаба: producer tuning на кластере

## Цель лабы

Создать topic, сравнить produce с разными **`linger.ms`** (через consumer lag по времени доставки — качественно), включить **`compression`**, отправить объём записей и проверить **размер сегментов** / throughput в UI.

## Предварительно

- [03. Producer tuning](03-producer-tuning.md).
- Кластер `docker-compose.cluster.yml` запущен.

---

## Задание 1. Topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.producer.tune \
  --partitions 3 --replication-factor 3
```

---

## Задание 2. «Быстрый» producer (linger=0)

Скрипт в shell (1000 сообщений):

```bash
for i in $(seq 1 1000); do
  printf 'key-%s|%s\n' "$((i % 3))" "payload-$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.producer.tune \
  --producer-property acks=all \
  --producer-property linger.ms=0 \
  --producer-property batch.size=16384 \
  --property parse.key=true --property key.separator='|'
```

Засеките время выполнения цикла (или `time` в bash).

---

## Задание 3. «Пакетный» producer (linger=50)

Повторите с другим topic, чтобы не смешивать:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.producer.tune.linger \
  --partitions 3 --replication-factor 3

for i in $(seq 1 1000); do
  printf 'key-%s|%s\n' "$((i % 3))" "payload-$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.producer.tune.linger \
  --producer-property acks=all \
  --producer-property linger.ms=50 \
  --producer-property batch.size=65536 \
  --property parse.key=true --property key.separator='|'
```

**Что увидите:** часто **linger=50** даёт меньше мелких запросов — wall-clock может быть сопоставим или чуть быстрее на batch; на малом объёме разница небольшая — смысл лабы в **механизме**, не в бенчмарке.

---

## Задание 4. Compression

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.producer.compress \
  --partitions 3 --replication-factor 3 \
  --config compression.type=producer

# повторяющийся payload — хорошо сжимается
for i in $(seq 1 500); do
  printf 'k1|%s\n' "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.producer.compress \
  --producer-property compression.type=lz4 \
  --producer-property acks=all
```

В Kafka UI → topic → смотрите **size** / segments (качественно: lz4 уменьшает байты на диске).

---

## Задание 5. Проверка распределения по partition

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.producer.tune \
  --from-beginning --timeout-ms 3000 \
  --property print.partition=true \
  --property print.key=true
```

**Что увидите:** ключи `key-0`, `key-1`, `key-2` попадают в **разные** partition стабильно.

---

## Критерии успеха

- [ ] Три topic созданы с **RF=3**.
- [ ] Produce с **acks=all** без ошибок на здоровом кластере.
- [ ] Объяснили, зачем **linger** и **batch.size**, назвали trade-off latency/throughput.
- [ ] Отправили batch с **lz4** и отметили эффект compression на повторяющихся данных.

**Дальше:** [05. Consumer tuning](05-consumer-tuning.md).
