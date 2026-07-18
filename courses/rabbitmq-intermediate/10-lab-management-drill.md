# 10. Лаба: Management API, Prometheus и drill «очередь растёт»

## Цель лабы

Снять метрики через **Management API** и **Prometheus :15692**, провести drill: остановить consumer, нагрузить очередь, зафиксировать рост **ready**, затем «догнать» до нуля.

## Предварительно

```bash
cd deploy/rabbitmq
docker compose up -d
./courses/rabbitmq-intermediate/examples/dlx-setup.sh
```

---

## Задание 1. Baseline API

```bash
curl -s -u course:course http://localhost:15672/api/overview | jq '.queue_totals'
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.work | jq '{name, messages_ready, messages_unacknowledged, consumers}'
```

**Что увидите:** JSON с нулевыми или малыми счётчиками.

---

## Задание 2. Prometheus scrape

```bash
curl -s http://localhost:15692/metrics | grep -E '^rabbitmq_queue_messages_ready' | head -5
```

Найдите метрику с label `queue="orders.work"` (если есть после активности).

**Что увидите:** текстовый exposition format `# HELP` / `# TYPE`.

---

## Задание 3. Drill backlog

Опубликуйте **20** сообщений без consumer:

```bash
for i in $(seq 1 20); do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
    routing_key=orders.work payload="{\"n\":$i}"
done
```

Проверка:

```bash
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.work | jq '.messages_ready'
```

**Что увидите:** `messages_ready` ≈ 20, `consumers` = 0.

---

## Задание 4. «Догоняющий» consumer

Вручную заберите пачку:

```bash
for i in $(seq 1 20); do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course get \
    queue=orders.work ackmode=ack_requeue_false
done
```

Снова API:

```bash
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.work | jq '.messages_ready'
```

**Что увидите:** 0.

Запишите в заметки **время** drill и пик ready — как мини-отчёт для финального проекта.

---

## Задание 5. DLQ alarm simulation

Положите poison в work и отправьте в DLQ (как в [04-lab-dlx](04-lab-dlx.md)), затем:

```bash
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.dlq | jq '.messages_ready'
```

**Порог алерта (учебный):** `messages_ready > 0` на `orders.dlq` → страница ops.

Сравните с CloudWatch на SQS DLQ из [aws-intermediate/19-cloudwatch.md](../aws-intermediate/19-cloudwatch.md).

---

## Задание 6. rabbitmqctl

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged consumers
docker exec mock-rabbitmq rabbitmq-diagnostics check_port_connectivity
```

**Что увидите:** таблица очередей согласуется с API.

---

## Критерии успеха

- [ ] Overview и queue API отвечают
- [ ] Метрики доступны на **:15692**
- [ ] Drill: ready 20 → 0 после consume
- [ ] DLQ depth проверен через API

Следующая теория: [11-managed-cloud.md](11-managed-cloud.md).
