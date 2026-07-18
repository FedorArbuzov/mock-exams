# 16. Лаба: Kafka Connect FileStream

## Цель лабы

Поднять Connect, создать **FileStreamSource** и **FileStreamSink** по примерам конфигов, прогнать строки **файл → topic → файл**.

## Предварительно

- [15. Kafka Connect](15-kafka-connect.md).
- Стенд: `docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d`

---

## Задание 1. Проверить Connect REST

```bash
curl -s http://localhost:8083/
curl -s http://localhost:8083/connector-plugins | head -c 500
```

**Что увидите:** версия Connect; в plugins — `FileStreamSource` / `FileStreamSink`.

---

## Задание 2. Подготовить файл в контейнере

```bash
docker exec mock-kafka-connect mkdir -p /tmp/connect-source /tmp/connect-sink
docker exec mock-kafka-connect bash -c 'echo line-one > /tmp/connect-source/orders.txt'
docker exec mock-kafka-connect bash -c 'echo line-two >> /tmp/connect-source/orders.txt'
```

---

## Задание 3. Создать source connector

Из корня репозитория (путь к JSON):

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d @courses/kafka-intermediate/examples/connect/file-source.json \
  http://localhost:8083/connectors
```

Проверка:

```bash
curl -s http://localhost:8083/connectors/file-source-orders/status | jq .
```

**Что увидите:** `"state":"RUNNING"`.

---

## Задание 4. Прочитать topic

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic connect.orders.raw \
  --from-beginning --timeout-ms 5000
```

**Что увидите:** `line-one`, `line-two` (и null key).

---

## Задание 5. Sink connector

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d @courses/kafka-intermediate/examples/connect/file-sink.json \
  http://localhost:8083/connectors
```

Подождите 5 с, прочитайте sink-файл:

```bash
docker exec mock-kafka-connect cat /tmp/connect-sink/out.txt
```

**Что увидите:** те же строки в `out.txt`.

---

## Задание 6. Добавить строку — source дочитает

```bash
docker exec mock-kafka-connect bash -c 'echo line-three >> /tmp/connect-source/orders.txt'
sleep 3
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic connect.orders.raw \
  --offset 2 --partition 0 --timeout-ms 3000
```

---

## Задание 7. Удалить connectors (cleanup)

```bash
curl -s -X DELETE http://localhost:8083/connectors/file-sink-orders
curl -s -X DELETE http://localhost:8083/connectors/file-source-orders
```

---

## Критерии успеха

- [ ] Source **RUNNING**, сообщения в `connect.orders.raw`.
- [ ] Sink записал в `/tmp/connect-sink/out.txt`.
- [ ] Понимаете путь **файл → topic → файл**.
- [ ] Использовали примеры из [`examples/connect/`](examples/connect/).

**Дальше:** верните **cluster** для [17. Мониторинг](17-monitoring.md).

```bash
docker compose -f docker-compose.yml -f docker-compose.extras.yml down
docker compose -f docker-compose.cluster.yml up -d
```
