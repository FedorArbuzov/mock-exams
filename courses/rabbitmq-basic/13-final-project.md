# 13. Финальный проект: маршрутизация уведомлений о заказе

## Введение: собрать basic в один контур

Отдельно вы умеете direct, fanout, topic, work queue и ack. **Финал** — сценарий **order notification routing** на [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md): событие заказа расходится по каналам (SMS, email), региональная фильтрация (EU), audit получает **всё**, failed payment уходит в отдельную очередь. Без новых сервисов — `rabbitmqadmin` / `rabbitmqctl` в `mock-rabbitmq`, UI **15672**, опционально [`examples/publish-consume.sh`](examples/publish-consume.sh).

## Что вы узнаете (итог курса)

- Спроектировать **топологию** exchange + queues + bindings.
- Опубликовать **набор событий** и проверить маршрутизацию таблицей.
- Описать **runbook** и поведение при сбое consumer (ack/requeue).

## Требования

| # | Требование | Критерий |
|---|------------|----------|
| 1 | Стенд | `docker compose up -d`, `smoke.sh` OK |
| 2 | Topic | exchange `proj.orders.topic`, pattern `orders.#` → audit |
| 3 | Region | `orders.eu.*` → queue `proj.orders.eu.q` |
| 4 | Direct notify | exchange `proj.notify.direct`, rk `notify.sms` / `notify.email` |
| 5 | Work | queue `proj.notify.worker.q` + 3+ сообщения, обработка get/ack |
| 6 | События | минимум 5 publish с разными rk (см. сценарий) |
| 7 | Документ | `PROJECT.md` по шаблону |
| 8 | Сравнение | 1 абзац: тот же сценарий в Kafka — [18-vs-queues](../kafka-basic/18-vs-queues.md) |

---

## Сценарий домена

Сервис **orders** публикует:

| routing key | Смысл |
|-------------|--------|
| `orders.eu.created` | заказ EU — audit + eu queue + fanout notify |
| `orders.us.created` | заказ US — audit + notify (не eu) |
| `orders.eu.payment.failed` | ошибка оплаты EU — audit + eu + **failed** queue |
| `notify.sms` / `notify.email` | задачи в worker (direct) |

---

## Фаза 1. Подготовка стенда

```bash
cd deploy/rabbitmq
docker compose up -d
bash scripts/smoke.sh
```

Опционально:

```bash
source courses/rabbitmq-basic/examples/publish-consume.sh
rmq_smoke
```

---

## Фаза 2. Топология (обязательная)

### 2.1 Topic + audit + EU

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=proj.orders.topic type=topic durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.orders.audit.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.orders.eu.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.orders.failed.q durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.orders.topic destination=proj.orders.audit.q routing_key='orders.#'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.orders.topic destination=proj.orders.eu.q routing_key='orders.eu.*'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.orders.topic destination=proj.orders.failed.q routing_key='orders.*.payment.failed'
```

### 2.2 Fanout notify (после order.created)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=proj.orders.fanout type=fanout durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.orders.notify.fanout.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.orders.fanout destination=proj.orders.notify.fanout.q
```

*(В реальном коде отдельный сервис читает fanout и публикует в `proj.notify.direct`; в проекте достаточно **документировать** этот шаг в PROJECT.md.)*

### 2.3 Direct notify + worker

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=proj.notify.direct type=direct durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.notify.sms.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.notify.email.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=proj.notify.worker.q durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.notify.direct destination=proj.notify.sms.q routing_key=notify.sms
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.notify.direct destination=proj.notify.email.q routing_key=notify.email
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=proj.notify.direct destination=proj.notify.worker.q routing_key=notify.task
```

---

## Фаза 3. Публикация событий

```bash
# EU created
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.orders.topic routing_key=orders.eu.created \
  payload='{"order_id":1001,"region":"eu"}'

# US created
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.orders.topic routing_key=orders.us.created \
  payload='{"order_id":1002,"region":"us"}'

# EU payment failed
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.orders.topic routing_key=orders.eu.payment.failed \
  payload='{"order_id":1001,"error":"card_declined"}'

# Fanout (имитация post-create)
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.orders.fanout routing_key=x payload='{"order_id":1001,"step":"notify"}'

# Direct tasks
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.notify.direct routing_key=notify.sms payload='{"order_id":1001,"text":"SMS"}'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.notify.direct routing_key=notify.email payload='{"order_id":1001,"text":"Email"}'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=proj.notify.direct routing_key=notify.task payload='{"order_id":1001,"job":"render"}'
```

Проверка:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep proj.
```

Заполните таблицу в `PROJECT.md` (ожидаемые минимумы):

| queue | ожидаемые msg (ориентир) |
|-------|--------------------------|
| `proj.orders.audit.q` | ≥ 3 |
| `proj.orders.eu.q` | ≥ 2 |
| `proj.orders.failed.q` | ≥ 1 |
| `proj.notify.sms.q` | 1 |

---

## Фаза 4. Consumers (эмуляция)

Обработайте **worker queue** с `ack_requeue_false` до опустошения. Одно сообщение из `proj.orders.eu.q` получите с `ack_requeue_true` и повторите — зафиксируйте redelivery в отчёте.

---

## Фаза 5. Runbook (шаблон)

В `PROJECT.md` секция **Runbook: сообщения не доходят**:

1. **Симптом:** depth растёт, consumers = 0.
2. **UI:** Exchanges → bindings; routing key совпадает?
3. **CLI:** `list_bindings`, `list_queues`.
4. **Unroutable:** publish с неверным rk — 0 в целевой queue.
5. **Poison:** reject без requeue / DLX (intermediate).
6. **Эскалация:** скрин топологии + пример payload.

---

## Шаблон PROJECT.md

```markdown
# RabbitMQ Basic — Final Project

## Автор / дата

## Стенд
- compose, контейнер mock-rabbitmq
- учётные данные course/course (lab only)

## Топология (диаграмма или список)
- proj.orders.topic → …
- proj.notify.direct → …

## Матрица маршрутизации
| publish rk | audit | eu | failed | sms | … |
|------------|-------|-----|--------|-----|---|

## События (лог publish)
- order_id 1001 …

## Ack / retry
- пример ack_requeue_true

## Runbook
- (вставьте секцию)

## Kafka comparison
- topic + groups vs exchanges + queues

## Выводы
- 3 bullets
```

---

## Критерии оценки (самопроверка)

- [ ] Все exchanges/queues из фазы 2 созданы
- [ ] Таблица маршрутизации заполнена и совпадает с `list_queues`
- [ ] Topic: `orders.us.created` **не** в `proj.orders.eu.q`
- [ ] `orders.eu.payment.failed` в audit и failed
- [ ] Worker queue обработана с ack
- [ ] Runbook читабелен без устных пояснений
- [ ] Ссылка на [`deploy/rabbitmq/README.md`](../../deploy/rabbitmq/README.md)

## Дальше

- [`rabbitmq-intermediate`](../rabbitmq-intermediate/README.md) — DLX, quorum, federation
- [kafka-basic/18](../kafka-basic/18-vs-queues.md) — сравнение брокеров
- [aws-intermediate/07-sqs-dlq](../aws-intermediate/07-sqs-dlq.md) — очереди в AWS

Поздравляем с завершением **RabbitMQ — Basic**.
