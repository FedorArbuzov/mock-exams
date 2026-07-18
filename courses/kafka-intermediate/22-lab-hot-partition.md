# 22. Лаба: hot partition

## Цель лабы

Создать **skew** нагрузки: 95% сообщений с одним key, увидеть неравномерность **size/offset** по partition в describe и consumer lag.

## Предварительно

- [21. Ёмкость](21-capacity.md).

---

## Задание 1. Topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.hot.partition \
  --partitions 6 --replication-factor 3
```

---

## Задание 2. Skewed produce

```bash
for i in $(seq 1 1000); do
  key="HOT-KEY"
  [ $((i % 20)) -eq 0 ] && key="cold-$((i % 6))"
  printf '%s|payload-%s\n' "$key" "$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.hot.partition \
  --property parse.key=true --property key.separator='|'
```

---

## Задание 3. Распределение по partition

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.hot.partition \
  --from-beginning --timeout-ms 3000 \
  --property print.partition=true --property print.key=true \
  | sort | uniq -c | sort -rn | head -20
```

**Что увидите:** одна partition содержит **большинство** строк с key `HOT-KEY`.

---

## Задание 4. Log end offset по partition

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.hot.partition
```

**Что увидите:** у одной partition **LOG-END** сильно выше остальных.

---

## Задание 5. Consumer lag при равном числе consumer

Запустите **один** consumer в группе `lab-hot-g1`, дочитайте до конца. Запустите **шесть** consumer в той же группе на **новом** topic с равномерными ключами (создайте `lab.hot.even`, 1000 сообщений с ключами `k0`…`k5` равномерно) — сравните время догонки.

Краткий вывод: почему **6 consumer** не помогают **одной** hot partition.

---

## Задание 6. План исправления (письменно)

Предложите **два** варианта без смены брокера: (1) изменение модели key; (2) вынос burst в отдельный topic.

---

## Критерии успеха

- [ ] Skew виден в **print.partition** и get-offsets.
- [ ] Объяснили, почему scale consumer не лечит hot key.
- [ ] Два варианта митигации в отчёте.

**Дальше:** [23. Операции](23-operations.md).
