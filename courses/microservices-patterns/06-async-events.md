# 06. Асинхронность и event-driven architecture

## Введение

Sync связывает **время жизни** запросов: billing тормозит checkout. **События** развязывают домены во времени; цена — **eventual consistency** и сложность отладки.

---

## Event notification vs event-carried state

| | Notification | Carried state |
|--|--------------|---------------|
| Payload | `order_id` | полный snapshot или delta |
| Coupling | consumer дергает API | толще сообщение, меньше sync |
| Риск | chatty sync | устаревшие данные в событии |

```json
// notification
{ "type": "OrderPaid", "order_id": "ord_42" }

// carried state
{ "type": "OrderPaid", "order": { "id": "ord_42", "total": 99.5, "items": [...] } }
```

---

## Event-driven building blocks

```text
Producer → [Topic/Exchange] → Consumer Group A
                            → Consumer Group B
```

| Паттерн | Использование |
|---------|---------------|
| **Pub/Sub** | fan-out (email + analytics) |
| **Competing consumers** | scale обработки |
| **Partition key** | порядок внутри `order_id` |

Выбор брокера: [messaging-deep](../messaging-deep/README.md).

---

## Choreography

Сервисы реагируют на события **без центрального оркестратора**:

```text
OrderPaid → Inventory reserves
         → Billing captures
         → Notification sends
```

| + | − |
|---|---|
| слабая связность | сложно понять глобальный flow |
| нет SPOF orchestrator | нет единого места состояния saga |

---

## Когда не events

| Ситуация | Лучше |
|----------|-------|
| Нужен ответ «да/нет» сейчас | sync |
| Один consumer, задача воркеру | queue ([python-celery](../python-celery/README.md)) |
| Критичный audit с немедленным read-your-writes | осторожно с async |

---

## Schema evolution событий

| Изменение | Совместимость |
|-----------|---------------|
| Новое optional поле | backward compatible |
| Удаление поля | breaking — новый `event_type` или version |
| Rename | новое поле + deprecate |

**Schema Registry** (Kafka): [kafka-intermediate](../kafka-intermediate/README.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| Kafka basics | [kafka-basic](../kafka-basic/README.md) |
| Rabbit fanout | [rabbitmq-basic/06](../rabbitmq-basic/06-pubsub-fanout.md) |
| SQS/EventBridge | [aws-intermediate/07,09](../aws-intermediate/07-sqs-dlq.md) |
| Celery pipeline | [python-celery/19–20](../python-celery/19-workflows-canvas.md) |

---

## Подзадачи

**Время:** ~55–65 мин.

### 6.1 Event catalog (20 мин)

Для домена Order выпишите **8 событий**. Для каждого: producer, consumers (список), notification vs carried state.

### 6.2 Partition key (10 мин)

Для `OrderPaid` какой key? Что будет при неправильном key (пример reorder)?

### 6.3 Choreography diagram (15 мин)

Mermaid sequence или ASCII: happy path + один fail path (кто компенсирует — пока без saga деталей).

### 6.4 Sync vs async decision (10 мин)

Таблица из 5 операций (create order, send email, check fraud, get product, charge card): sync/async + почему.

### 6.5 Schema change (10 мин)

Сценарий: добавили `tax_id` в Order. Как выкатить без остановки старых consumers?

---

## Резюме

Events — для **fan-out и decoupling во времени**. Документируйте каталог событий и правила эволюции схемы; не заменяйте ими все sync без причины.

---

## Чек-лист

- [ ] Event catalog с producers/consumers?
- [ ] Partition key обоснован?
- [ ] Breaking event change = новая версия?

**Дальше:** [07. API Gateway, BFF и mesh](07-gateway-bff-mesh.md).
