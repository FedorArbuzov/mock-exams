# 13. Лаба: mini pipeline (raw → enriched)

## Цель лабы

Собрать **два topic**: сырые заказы и обогащённые. Роль «Enricher» — consumer из `orders.raw` + producer в `orders.enriched` (вручную через CLI, без кода).

## Предварительно

- Стенд Kafka.
- [12. Паттерны](12-patterns.md), [11. Лаба](11-lab-serialization.md).

---

## Задание 1. Создать topics

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic orders.raw --partitions 3 --replication-factor 1 --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic orders.enriched --partitions 3 --replication-factor 1 --if-not-exists
```

---

## Задание 2. Сырое событие в orders.raw

```bash
printf '%s\n' 'ord-pipe-1|{"eventType":"order.created","orderId":"ord-pipe-1","customerTier":"SILVER"}' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic orders.raw \
  --property parse.key=true --property key.separator='|'
```

---

## Задание 3. «Enricher» — прочитать и записать обогащённое

Прочитайте (один раз):

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.raw \
  --group pipeline-enricher \
  --from-beginning \
  --property print.key=true \
  --timeout-ms 5000
```

Вручную сформируйте enriched (добавили поле `discountPercent` по tier):

```bash
printf '%s\n' 'ord-pipe-1|{"eventType":"order.enriched","orderId":"ord-pipe-1","customerTier":"SILVER","discountPercent":5}' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic orders.enriched \
  --property parse.key=true --property key.separator='|'
```

> В production enricher — долгоживущий сервис в цикле poll; здесь — имитация шага pipeline.

---

## Задание 4. Downstream consumer

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.enriched \
  --group analytics \
  --from-beginning \
  --timeout-ms 5000
```

**Что увидите:** JSON с `discountPercent":5`.

---

## Задание 5. Kafka UI

В [http://localhost:8080](http://localhost:8080) — topics `orders.raw` и `orders.enriched`, сообщения, lag группы `pipeline-enricher` (должен быть 0).

---

## Критерии успеха

- [ ] Оба topic созданы
- [ ] Сообщение в `orders.raw` прочитано группой `pipeline-enricher`
- [ ] Обогащённое сообщение в `orders.enriched` прочитано группой `analytics`
- [ ] Key `ord-pipe-1` сохранён на обоих этапах

## Что унести в работу

- Pipeline = несколько topics + идемпотентные consumer.
- Имена: `domain.stage` (`orders.raw`, `orders.enriched`).

Следующий урок: [14. Сбои](14-failures.md).
