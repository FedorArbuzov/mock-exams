# 09. Очереди и события: SQS, SNS, EventBridge

## Зачем messaging в облаке

Синхронный вызов (API → API) ломается при пиках нагрузки и падении downstream. **Асинхронные очереди и события** развязывают сервисы:

```text
Producer → Queue → Consumer (масштабируется независимо)
Producer → Topic → много Subscribers
```

## SQS (Simple Queue Service)

**Очередь сообщений** — pull-модель: consumer сам забирает сообщения.

| Тип | Особенность |
|---|---|
| **Standard** | At-least-once, порядок не гарантирован, высокая пропускная |
| **FIFO** | Exactly-once (в рамках FIFO), строгий порядок, суффикс `.fifo` |

```text
API → SendMessage → SQS queue
                         ↓
                    Lambda / EC2 worker (ReceiveMessage, DeleteMessage после обработки)
```

**Visibility timeout** — пока consumer обрабатывает, сообщение скрыто; если не удалил — вернётся в очередь.

**Dead Letter Queue (DLQ)** — сообщения после N неудачных попыток → отдельная очередь для разбора.

## SNS (Simple Notification Service)

**Pub/Sub**: один publisher — много subscribers (SQS, Lambda, email, HTTP).

```text
OrderCreated event
    → SNS Topic "orders"
         ├── SQS (warehouse)
         ├── Lambda (analytics)
         └── Email (ops alert)
```

Fan-out: SNS может **дублировать** в несколько SQS (каждая со своим consumer).

## SQS vs SNS

| | SQS | SNS |
|---|---|---|
| Модель | Очередь (1 consumer group на очередь) | Топик (много подписчиков) |
| Доставка | Pull | Push |
| Типичное use | Буфер, backpressure | Уведомления, fan-out |

Частый паттерн: **SNS → несколько SQS** (каждый сервис свою очередь).

## EventBridge

**Event bus** для событий в стиле cloud-native:

- События от AWS сервисов (EC2 state change, S3 через EventBridge rule).
- **Custom events** от ваших приложений.
- **Rules** — фильтр по `detail-type`, `source` → target (Lambda, SQS, Step Functions).
- **Scheduler** — cron без отдельного EC2.

```json
{
  "source": "my.app",
  "detail-type": "ImageProcessed",
  "detail": { "image_id": "abc-123", "status": "ok" }
}
```

EventBridge vs SNS: EventBridge лучше для **маршрутизации и фильтрации** сложных event-схем; SNS проще для fan-out уведомлений.

## Интеграция с Lambda

| Источник | Поведение |
|---|---|
| SQS | Lambda polling batch (до 10 сообщений), partial batch failure |
| SNS | Push на каждое сообщение |
| EventBridge | Rule → Lambda с event payload |

**Идемпотентность** обязательна: SQS Standard может доставить дубликат.

## S3 events (связь с уроком 06–08)

Прямо S3 → Lambda возможно. Часто добавляют SQS между ними:

```text
S3 → SQS → Lambda
```

Плюс: буфер при всплеске загрузок; DLQ для poison messages.

## Step Functions (упоминание)

Оркестрация **workflow** (цепочка Lambda, wait, choice). Для сложных pipeline вместо «лапши» из Lambda вызывающих Lambda.

## Локальная эмуляция

LocalStack / MiniStack эмулируют SQS, SNS, EventBridge. Очереди и правила создаются через Terraform так же, как в AWS.

## Чек-лист

- Чем Standard SQS отличается от FIFO?
- Зачем DLQ?
- Когда SNS, когда SQS?
- Что делает EventBridge rule?
- Почему consumer должен быть идемпотентным?

Следующий урок: [10-local-emulation.md](10-local-emulation.md).
