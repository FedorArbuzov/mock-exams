# 03. Лаба: exchange, queue, binding, publish и get

## Цель лабы

Поднять стенд RabbitMQ, объявить **direct exchange**, **очередь**, **binding**, опубликовать сообщение с **routing key**, прочитать через `rabbitmqadmin get` и проверить в **Management UI**.

## Предварительно

- Docker, порты **5672** и **15672** свободны.
- Из корня репозитория:

```bash
cd deploy/rabbitmq
docker compose up -d
docker compose ps
bash scripts/smoke.sh
```

Теория: [02. Архитектура](02-architecture.md).  
Сниппеты (опционально): [`examples/publish-consume.sh`](examples/publish-consume.sh).

---

## Задание 1. Ping и встроенные exchanges

**Зачем:** убедиться, что брокер healthy.

```bash
docker exec mock-rabbitmq rabbitmq-diagnostics -q ping
docker exec mock-rabbitmq rabbitmqadmin -u course -p course list exchanges name type | head -8
```

**Что увидите:** `Ping succeeded`; список `amq.direct`, `amq.fanout`, …

---

## Задание 2. Объявить exchange и queue

**Зачем:** явная топология вместо «магии» default exchange.

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.first.ex type=direct durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.first.q durable=true
```

Проверка:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.first
```

**Что увидите:** `lab.first.q` с `0` messages.

---

## Задание 3. Binding

**Зачем:** без binding publish не попадёт в очередь.

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.first.ex destination=lab.first.q routing_key=lab.first.key

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  list bindings source destination routing_key | grep lab.first
```

**Что увидите:** строка `lab.first.ex` → `lab.first.q`, `lab.first.key`.

---

## Задание 4. Publish

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.first.ex routing_key=lab.first.key \
  payload='{"event":"hello","n":1}'

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.first
```

**Что увидите:** `lab.first.q` — **1** message (ready).

**Неверный routing key** (проверка понимания):

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.first.ex routing_key=wrong.key payload=orphan
docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.first
```

Сообщение с `wrong.key` **не увеличит** счётчик `lab.first.q` (unroutable; на стенде без mandatory — silently dropped).

---

## Задание 5. Get (ручной consumer)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.first.q ackmode=ack_requeue_false count=1

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.first
```

**Что увидите:** в выводе `get` — payload `hello`; в list_queues — снова **0** messages.

---

## Задание 6. Management UI

1. Откройте [http://localhost:15672](http://localhost:15672) — `course` / `course`.
2. **Exchanges** → `lab.first.ex` → вкладка **Bindings**.
3. **Queues** → `lab.first.q` → **Publish message** (опционально) и **Get messages**.

---

## Задание 7. Сброс (опционально)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.first.q
```

Или удалить объекты перед следующей лабой:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course delete queue name=lab.first.q
docker exec mock-rabbitmq rabbitmqadmin -u course -p course delete exchange name=lab.first.ex
```

---

## Критерии успеха

- [ ] `rabbitmq-diagnostics ping` успешен
- [ ] Exchange `lab.first.ex` type **direct**, queue **durable**
- [ ] Binding с `lab.first.key` создан
- [ ] После publish в queue **1** message; после get — **0**
- [ ] В UI видны exchange, queue и binding

## Что унести в работу

- Цепочка: **declare exchange → queue → binding → publish → consume/ack**
- **Routing key** на publish должен совпадать с binding (direct)
- Диагностика: `list_queues`, UI **Bindings**

Следующий урок: [04. Work queues](04-work-queues.md).
