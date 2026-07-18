# 09. Лаба: direct и topic routing

## Цель лабы

Настроить **direct** (SMS vs email) и **topic** (`orders.eu.*` vs `orders.#`), опубликовать сообщения с разными **routing key** и проверить, в каких очередях они оказались.

## Предварительно

- Стенд поднят, теория [08](08-routing-direct-topic.md).

---

## Часть A. Direct

### A.1 Топология

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.route.direct type=direct durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.route.sms.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.route.email.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.route.direct destination=lab.route.sms.q routing_key=notify.sms
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.route.direct destination=lab.route.email.q routing_key=notify.email
```

### A.2 Publish и проверка

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.direct routing_key=notify.sms payload='{"channel":"sms"}'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.direct routing_key=notify.email payload='{"channel":"email"}'

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.route
```

**Что увидите:** `sms.q` → 1, `email.q` → 1.

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.route.sms.q ackmode=ack_requeue_false count=1
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.route.email.q ackmode=ack_requeue_false count=1
```

---

## Часть B. Topic

### B.1 Топология

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.route.topic type=topic durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.route.eu.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.route.all.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.route.topic destination=lab.route.eu.q routing_key='orders.eu.*'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.route.topic destination=lab.route.all.q routing_key='orders.#'
```

### B.2 Три publish

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.topic routing_key=orders.eu.created payload=eu-created
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.topic routing_key=orders.us.created payload=us-created
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.topic routing_key=orders.eu.uk.created payload=eu-uk-created

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.route
```

**Что увидите (ожидание):**

| rk | eu.q | all.q |
|----|------|-------|
| `orders.eu.created` | +1 | +1 |
| `orders.us.created` | 0 | +1 |
| `orders.eu.uk.created` | 0 | +1 |

Третье сообщение **не** матчит `orders.eu.*` (три слова после orders).

### B.3 Прочитать и сверить

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.route.eu.q ackmode=ack_requeue_false count=5
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.route.all.q ackmode=ack_requeue_false count=5
```

---

## Задание 3. Таблица в заметках

Заполните для себя:

```text
rk orders.eu.shipped → eu.q ?  all.q ?
rk orders.cancelled   → eu.q ?  all.q ?
```

Проверьте publish + list_queues.

---

## Задание 4. Очистка

```bash
for q in lab.route.sms.q lab.route.email.q lab.route.eu.q lab.route.all.q; do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=$q
done
```

---

## Критерии успеха

- [ ] Direct: sms/email только в свои очереди
- [ ] Topic: `orders.eu.created` в **обеих** eu и all
- [ ] Topic: `orders.eu.uk.created` только в all
- [ ] Объясняете, почему `*` не матчит три слова

## Что унести в работу

- Direct = точный rk; topic = pattern в binding
- Документируйте матрицу rk → queues
- Для финального проекта — topic `orders.#` и direct каналы

Следующий урок: [10. Ack и prefetch](10-ack-prefetch.md).
