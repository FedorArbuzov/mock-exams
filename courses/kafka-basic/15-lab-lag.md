# 15. Лаба: consumer lag в Kafka UI

## Цель лабы

Накопить **lag** на учебном topic, увидеть его в **CLI** и **Kafka UI**, затем «догнать» consumer до **LAG=0**.

## Предварительно

- [`deploy/kafka`](../../deploy/kafka/README.md) с UI на [http://localhost:8080](http://localhost:8080).
- [14. Сбои](14-failures.md).

---

## Задание 1. Наполнить topic

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.lag-ui \
  --partitions 2 --replication-factor 1 --if-not-exists

for i in $(seq 1 100); do
  echo "lag-msg-$i" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 --topic lab.lag-ui
done
```

---

## Задание 2. Частичное чтение

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.lag-ui \
  --group lab-lag-ui-workers \
  --max-messages 25 \
  --timeout-ms 20000
```

---

## Задание 3. Lag в CLI

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-lag-ui-workers --describe
```

**Что увидите:** колонки `LOG-END-OFFSET`, `CURRENT-OFFSET`, `LAG` — суммарно ~75 (зависит от распределения по 2 partition).

Запишите:

```text
Partition 0 LAG: ___
Partition 1 LAG: ___
```

---

## Задание 4. Kafka UI

1. Откройте [http://localhost:8080](http://localhost:8080).
2. Consumers → группа `lab-lag-ui-workers`.
3. Topic `lab.lag-ui` — lag по partition.

**Скриншот не обязателен** — убедитесь, что UI совпадает с CLI.

---

## Задание 5. Догнать lag

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.lag-ui \
  --group lab-lag-ui-workers \
  --timeout-ms 30000
```

Ctrl+C после того как сообщения кончились.

Повторите `--describe`:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-lag-ui-workers --describe
```

**Что увидите:** `LAG` = **0** (или пусто) на всех partition.

---

## Задание 6. (Опц.) Медленный consumer

Пока consumer **не** запущен, добавьте ещё 50 сообщений и снова проверьте lag — он вырастет. Обсудите: в prod «медленный» = долгий handler или малый `max.poll.records`.

---

## Критерии успеха

- [ ] ≥100 сообщений в `lab.lag-ui`
- [ ] После 25 сообщений `LAG` > 0 в CLI
- [ ] UI показывает ту же группу и lag
- [ ] После полного consume `LAG` = 0

## Что унести в работу

- Алерт строят на **max lag** и **lag increase rate**.
- Первый шаг on-call: `--describe` + UI, не перезапуск наугад.

Следующий урок: [16. CLI](16-cli.md).
