# 18. Лаба: drill — рост lag и восстановление

## Цель лабы

Смоделировать **инцидент lag**: залить burst, «остановить» обработку (не commit / остановить consumer), зафиксировать метрики в CLI/UI, **масштабировать** consumer и вернуть lag к нулю.

## Предварительно

- [17. Мониторинг](17-monitoring.md).
- Кластер: `docker-compose.cluster.yml`.

---

## Задание 1. Topic и baseline

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.lag.drill \
  --partitions 6 --replication-factor 3

docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-lag-drill-g1 2>/dev/null || true
```

---

## Задание 2. Burst produce

```bash
for i in $(seq 1 5000); do
  printf 'user-%03d|evt-%s\n' "$((i % 20))" "$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.lag.drill \
  --producer-property acks=all \
  --producer-property compression.type=lz4 \
  --property parse.key=true --property key.separator='|'
```

---

## Задание 3. Медленный consumer (создать lag)

Запустите consumer с `max.poll.records=5`, прервите через ~5 с:

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.lag.drill \
  --group lab-lag-drill-g1 \
  --consumer-property max.poll.records=5
```

---

## Задание 4. Зафиксировать lag (T0)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-lag-drill-g1
```

Запишите **суммарный LAG** (сложите колонку LAG) и partition с **максимальным** lag.

**Скриншот:** Kafka UI → Consumer Group `lab-lag-drill-g1`.

---

## Задание 5. Масштабирование — 3 consumer

В трёх терминалах (или по очереди) запустите с одним `group.id` и большим `max.poll.records`:

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.lag.drill \
  --group lab-lag-drill-g1 \
  --consumer-property max.poll.records=500
```

Каждые 30 с повторяйте `--describe` до **LAG=0** везде.

---

## Задание 6. Отчёт инцидента (шаблон)

| Поле | Значение |
|------|----------|
| Симптом | lag ↑ на `lab-lag-drill-g1` |
| T0 суммарный lag | … |
| Hot partition | … |
| Действие | +2 consumer |
| T1 lag=0 | … мин |

---

## Критерии успеха

- [ ] Burst **5000** сообщений.
- [ ] Зафиксировали **LAG > 0** и hot partition.
- [ ] Догнали до **LAG=0** масштабированием группы.
- [ ] Заполнили мини-отчёт.

**Дальше:** [19. Безопасность](19-security-basics.md).
