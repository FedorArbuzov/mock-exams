# 09. Saga: оркестрация и хореография

## Введение

«Нужна распределённая транзакция» — в микросервисах это **saga**: цепочка **локальных** транзакций с **компенсирующими** шагами при сбое. Не 2PC на проде ([messaging-deep/10](../messaging-deep/10-outbox-saga.md)).

---

## Проблема

```text
Order (local TX) → Reserve inventory → Charge payment
                         ↓ fail
                   ??? rollback order
```

Нет единого `COMMIT` на три БД.

---

## Choreography saga

Каждый сервис слушает события и публикует следующее:

```text
OrderCreated → InventoryReserved | InventoryFailed
InventoryReserved → PaymentCaptured | PaymentFailed
PaymentFailed → InventoryReleased (compensate)
```

| + | − |
|---|---|
| нет orchestrator SPOF | сложный граф, «где застряло» |
| слабая связность | дублирование правил переходов |

---

## Orchestration saga

Центральный **orchestrator** (state machine):

```text
[Saga Orchestrator]
   ├─ command ReserveInventory
   ├─ command CapturePayment
   └─ on fail → CompensateInventory
```

| + | − |
|---|---|
| явное состояние saga | orchestrator — critical component |
| проще отладка | риск «god orchestrator» |

Реализации: Temporal, Cadence, custom state table + Celery ([python-celery](../python-celery/README.md)).

---

## Компенсация ≠ undo

| Forward | Compensate |
|---------|------------|
| Reserve stock | Release stock |
| Capture payment | Refund (может быть async!) |
| Send email | send «cancelled» (не удалить письмо) |

Компенсация **семантическая**; не всегда symmetric.

---

## Идемпотентность шагов

Каждый шаг saga:

```text
saga_id + step_name → unique constraint
повтор команды → no-op или same result
```

Обязательно при at-least-once messaging.

---

## Timeout и «висящие» saga

| Состояние | Действие |
|-----------|----------|
| Payment pending > 15 min | auto cancel + compensate inventory |
| Unknown | human intervention + alert |

Saga state в **DB orchestrator** или event log.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Outbox + events | [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| Celery canvas | [python-celery/19](../python-celery/19-workflows-canvas.md) |
| Idempotency | [api-design/08](../api-design/08-idempotency-retries.md) |

---

## Подзадачи

**Время:** ~60–70 мин.

### 9.1 Happy path (15 мин)

Нарисуйте saga «Place Order» (3 шага). Укажите локальные TX границы каждого сервиса.

### 9.2 Failure matrix (20 мин)

Таблица: шаг fail | уже выполнено | compensate | финальный статус Order |

### 9.3 Choreography vs orchestration (15 мин)

Для вашего кейса выберите стиль; 3 аргумента; что rejected.

### 9.4 State machine (10 мин)

Список состояний saga (`PENDING_PAYMENT`, …) и допустимых переходов.

### 9.5 Idempotency (10 мин)

Для шага `CapturePayment` опишите dedup key и хранилище.

---

## Резюме

Saga — **бизнес-процесс** с компенсациями, не XA transaction. Выберите orchestration при сложности; choreography при простом fan-out — и документируйте таймауты.

---

## Чек-лист

- [ ] Compensations для каждого forward step?
- [ ] Saga state наблюдаем?
- [ ] Шаги идемпотентны?

**Дальше:** [10. Outbox, inbox и event sourcing](10-outbox-eventsourcing.md).
