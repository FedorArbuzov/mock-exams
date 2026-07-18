# 14. Лаба: Schema Registry

## Цель лабы

Поднять **Schema Registry** через extras compose, зарегистрировать **JSON Schema**, проверить **совместимую** и **несовместимую** эволюцию через REST.

## Предварительно

- [13. Schema Registry](13-schema-registry.md).

## Стенд

```bash
cd deploy/kafka
docker compose -f docker-compose.cluster.yml down
docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d
```

| Сервис | URL |
|--------|-----|
| Kafka (хост) | `localhost:9094` |
| Schema Registry | [http://localhost:8081](http://localhost:8081) |

> Overlay [`docker-compose.extras.yml`](../../deploy/kafka/docker-compose.extras.yml) подключает Registry и Connect к **одноброкерному** `docker-compose.yml`. После лабы верните cluster для глав 15–24.

---

## Задание 1. Health Registry

```bash
curl -s http://localhost:8081/
```

**Что увидите:** JSON с версией Registry.

---

## Задание 2. Зарегистрировать JSON Schema v1

```bash
curl -s -X POST -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{
    "schema": "{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"title\":\"Order\",\"type\":\"object\",\"properties\":{\"orderId\":{\"type\":\"string\"},\"amount\":{\"type\":\"number\"}},\"required\":[\"orderId\",\"amount\"]}"
  }' \
  http://localhost:8081/subjects/lab.orders-value/versions
```

**Что увидите:** `{"id":1,...}` (id может отличаться).

---

## Задание 3. Прочитать latest

```bash
curl -s http://localhost:8081/subjects/lab.orders-value/versions/latest | jq .
```

---

## Задание 4. Совместимое изменение (BACKWARD)

Добавьте optional поле `currency` с default:

```bash
curl -s -X POST -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{
    "schema": "{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"title\":\"Order\",\"type\":\"object\",\"properties\":{\"orderId\":{\"type\":\"string\"},\"amount\":{\"type\":\"number\"},\"currency\":{\"type\":\"string\",\"default\":\"USD\"}},\"required\":[\"orderId\",\"amount\"]}"
  }' \
  http://localhost:8081/subjects/lab.orders-value/versions
```

**Что увидите:** версия **2** зарегистрирована.

---

## Задание 5. Несовместимое изменение

Попробуйте удалить required `amount`:

```bash
curl -s -X POST -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{
    "schema": "{\"type\":\"object\",\"properties\":{\"orderId\":{\"type\":\"string\"}}}"
  }' \
  http://localhost:8081/subjects/lab.orders-value/versions
```

**Что увидите:** **409** / ошибка compatibility (если режим BACKWARD) — Registry **отклонил** схему.

---

## Задание 6. Список subjects

```bash
curl -s http://localhost:8081/subjects
```

---

## Критерии успеха

- [ ] Registry отвечает на :8081.
- [ ] Зарегистрированы **v1** и совместимая **v2**.
- [ ] Несовместимая схема **отклонена** (или объяснили, почему прошла при NONE).
- [ ] Вернули cluster compose для следующих глав (по README).

**Дальше:** [15. Kafka Connect](15-kafka-connect.md).
