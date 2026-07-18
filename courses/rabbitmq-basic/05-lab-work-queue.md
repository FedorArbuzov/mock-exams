# 05. Лаба: work queue и два competing consumer

## Цель лабы

Собрать **work queue**, опубликовать **10 задач**, забрать их **двумя** параллельными `get` (эмуляция двух workers) и убедиться, что каждое сообщение обработано **один раз**.

## Предварительно

- Стенд из [лабы 03](03-lab-first-queue.md) поднят.
- Теория: [04. Work queues](04-work-queues.md).

```bash
cd deploy/rabbitmq
docker compose ps
```

---

## Задание 1. Топология work queue

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.work.ex type=direct durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.work.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.work.ex destination=lab.work.q routing_key=task
```

**Что увидите:** `queue declared`, `binding declared`.

---

## Задание 2. Опубликовать 10 задач

```bash
for i in $(seq 1 10); do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
    publish exchange=lab.work.ex routing_key=task payload="task-$i"
done

docker exec mock-rabbitmq rabbitmqctl list_queues name messages consumers | grep lab.work
```

**Что увидите:** `lab.work.q` — **10** messages, **0** consumers (пока никто не subscribe через долгоживущий consumer).

---

## Задание 3. Два «worker» в параллели

**Терминал A** (оставьте цикл):

```bash
while docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.work.q ackmode=ack_requeue_false count=1 2>/dev/null | grep -q payload; do
  sleep 0.3
done
echo "worker A done"
```

**Терминал B** — тот же цикл с меткой `worker B`.

Либо **одним скриптом** (последовательная эмуляция round-robin):

```bash
for round in $(seq 1 10); do
  worker=$(( round % 2 + 1 ))
  echo "--- round $round worker $worker ---"
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
    get queue=lab.work.q ackmode=ack_requeue_false count=1
done
```

**Что увидите:** 10 разных payload `task-1` … `task-10`; очередь пуста.

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.work
```

**0** messages.

---

## Задание 4. Проверка «не обработано дважды»

Повторно выполните один `get`:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.work.q ackmode=ack_requeue_false count=1
```

**Что увидите:** пустой ответ / нет payload — дубликатов нет.

---

## Задание 5. UI: Publish burst

1. UI → **Queues** → `lab.work.q` → **Publish message** (5 раз) routing через exchange вручную или снова цикл publish.
2. Вкладка **Consumers** после запуска долгоживущего consumer в коде (в basic достаточно знать, что UI показывает **активных** подписчиков).

---

## Задание 6. Сброс

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.work.q
```

---

## Критерии успеха

- [ ] 10 сообщений опубликованы, все извлечены
- [ ] После обработки `messages=0`
- [ ] Ни одно `task-N` не получено дважды при `ack_requeue_false`
- [ ] Понимаете, зачем **одна** queue на всех workers

## Что унести в работу

- Масштаб workers = больше consumer на **той же** queue
- `ack_requeue_false` = задача снята с очереди
- Метрика: `messages_ready`, `consumers`

Следующий урок: [06. Pub/Sub fanout](06-pubsub-fanout.md).
