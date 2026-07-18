# 02. Лаба: quorum-очередь и кластер

## Цель лабы

На стенде [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md) вы объявите **quorum-очередь** с `x-queue-type=quorum`, опубликуете и прочитаете сообщения, затем (опционально) повторите на **трёхузловом кластере** после `init-cluster.sh`.

## Предварительно

- Docker запущен.
- Порты `5672`, `15672` свободны.

```bash
cd deploy/rabbitmq
docker compose down
docker compose up -d
docker compose ps
```

Дождитесь **healthy** (`rabbitmq-diagnostics ping`).

---

## Задание 1. Quorum на single node

**Зачем:** убедиться, что declare с `x-queue-type` работает без cluster.

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course declare queue \
  name=lab.quorum.single durable=true \
  arguments='{"x-queue-type":"quorum"}'
```

Публикация и потребление:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  routing_key=lab.quorum.single payload='{"orderId":"Q-1"}'

docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.quorum.single ackmode=ack_requeue_false
```

**Что увидите:** тип очереди `quorum` в UI (Queues → `lab.quorum.single`), одно сообщение извлечено.

Проверка через ctl:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name type messages --formatter table
```

---

## Задание 2. JSON из примера курса

**Зачем:** связать лабу с [`examples/quorum-queue-declare.json`](examples/quorum-queue-declare.json).

```bash
cd courses/rabbitmq-intermediate
curl -sf -u course:course -H "content-type: application/json" \
  -X PUT "http://localhost:15672/api/queues/%2F/lab.quorum.api" \
  -d @- <<'EOF'
{
  "durable": true,
  "auto_delete": false,
  "arguments": {
    "x-queue-type": "quorum"
  }
}
EOF
```

**Что увидите:** HTTP 201/204; очередь в UI с типом quorum.

---

## Задание 3 (опционально). Трёхузловой кластер

**Зачем:** увидеть Raft group size 3 «по-настоящему».

```bash
cd deploy/rabbitmq
docker compose down
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

Объявление на **первом** узле:

```bash
docker exec mock-rabbitmq-1 rabbitmqadmin -u course -p course declare queue \
  name=lab.quorum.cluster durable=true \
  arguments='{"x-queue-type":"quorum","x-quorum-initial-group-size":3}'
```

Статус кластера:

```bash
docker exec mock-rabbitmq-1 rabbitmqctl cluster_status
```

Публикация через **второй** узел (порт 5673 с хоста):

```bash
docker exec mock-rabbitmq-2 rabbitmqadmin -u course -p course -H localhost:15672 declare binding \
  source=amq.default destination=lab.quorum.cluster routing_key=lab.quorum.cluster 2>/dev/null || true

docker exec mock-rabbitmq-2 rabbitmqadmin -u course -p course publish \
  routing_key=lab.quorum.cluster payload='from-node-2'
```

**Что увидите:** `Running Nodes` — три узла; сообщение видно на `mock-rabbitmq-1` в `list_queues`.

Вернитесь к single для следующих глав:

```bash
docker compose -f docker-compose.cluster.yml down
docker compose up -d
```

---

## Критерии успеха

- [ ] Очередь `lab.quorum.single` типа **quorum**, сообщение опубликовано и получено
- [ ] Очередь через Management API создана с `x-queue-type`
- [ ] (Опц.) Кластер из 3 узлов, `init-cluster.sh` без ошибок, quorum на кластере

Следующая теория: [03-dead-letter-exchange.md](03-dead-letter-exchange.md).
