# 16. Лаба: URP — симуляция на трёх брокерах и recovery

## Цель лабы

На **3-broker** KRaft кластере создать topic **RF=3**, остановить одного брокера, увидеть **URP**, восстановить ISR и задокументировать runbook.

## Предварительно

- [15-troubleshooting](15-troubleshooting.md).
- RAM ≥ 4 GB.

```bash
cd deploy/kafka
docker compose down
docker compose -f docker-compose.cluster.yml up -d
```

Bootstrap внутри сети: `kafka-1:9092`. С хоста: `localhost:9091,9092,9093`.

---

## Задание 1. Topic RF=3

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.urp.test \
  --partitions 6 --replication-factor 3 \
  --config min.insync.replicas=2

docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.urp.test
```

**Что увидите:** leaders на 1/2/3, ISR по 3 ноды.

---

## Задание 2. Нагрузка (опционально)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-producer-perf-test.sh \
  --topic lab.urp.test \
  --num-records 50000 --record-size 1024 \
  --throughput 5000 \
  --producer-props bootstrap.servers=kafka-1:9092 acks=all \
  --if-exists
```

Или несколько сообщений через console producer.

---

## Задание 3. Остановить брокер-2

```bash
docker stop mock-kafka-2
```

Подождите 30–60 с.

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.urp.test
```

**Что увидите:** ISR размер 2, возможно **Isr: 1,3** без 2; метрика URP в UI или:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --under-replicated-partitions
```

Запишите **какие partition** затронуты.

---

## Задание 4. Produce с acks=all при min ISR=2

Попробуйте produce с хоста или exec:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.urp.test \
  --producer-property acks=all
```

**Ожидание:** пока ≥2 ISR живы — успех; если ISR=1 — `NOT_ENOUGH_REPLICAS`.

---

## Задание 5. Recovery

```bash
docker start mock-kafka-2
```

Через 1–2 мин:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.urp.test
```

**Что увидите:** broker 2 снова в ISR, URP → 0.

---

## Задание 6. Runbook (письменно)

Шаблон на 10 строк:

1. **Detect:** alert `UnderReplicatedPartitions`
2. **Assess:** offline vs URP only
3. **Mitigate:** restore broker / disk
4. **Validate:** describe topic, producer test
5. **Escalate:** if offline > 0 > 15 min

---

## Задание 7. Cleanup

```bash
docker compose -f docker-compose.cluster.yml down
docker compose up -d
```

---

## Критерии успеха

- [ ] Создали RF=3 topic с `min.insync.replicas=2`.
- [ ] Увидели URP после stop broker.
- [ ] Восстановили ISR после start.
- [ ] Runbook 10 строк.

## Если не работает

| Симптом | Решение |
|---------|---------|
| Cannot create RF=3 | все 3 брокера healthy? |
| Нет URP после stop | подождать, RF может показывать URP только на leader copies |
| Имена контейнеров | `docker ps` — adjust mock-kafka-1/2/3 |

**Дальше:** [17-interview-qa](17-interview-qa.md).
