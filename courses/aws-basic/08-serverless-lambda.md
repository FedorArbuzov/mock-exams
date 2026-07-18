# 08. Serverless и Lambda

## Что такое serverless

**Serverless** — вы пишете **код**, AWS управляет **серверами**, масштабированием и (частично) availability. Платите за **вызовы и время выполнения**, не за простаивающие VM.

Главный сервис — **AWS Lambda**. Рядом: API Gateway, Step Functions, EventBridge.

## Lambda: модель выполнения

```text
Trigger (S3, API Gateway, SQS, schedule, ...)
    → Lambda service
        → Container с вашим runtime (холодный / тёплый start)
        → Handler выполняется
        → Результат / ошибка
```

| Параметр | Типичное значение |
|---|---|
| **Runtime** | Python 3.12, Node 20, Go custom, etc. |
| **Memory** | 128 MB – 10 GB (влияет на CPU) |
| **Timeout** | до 15 минут |
| **Deployment package** | zip или container image |
| **Concurrency** | Лимит на account и reserved per function |

## Холодный и тёплый старт

- **Cold start** — первый вызов или после простоя: скачать образ, инициализировать runtime.
- **Warm** — повторные вызовы быстрее; AWS может держать sandbox.

Для latency-critical API — provisioned concurrency (платно).

## Триггеры (event sources)

| Источник | Сценарий |
|---|---|
| **S3** | Новый объект → обработка |
| **API Gateway / Function URL** | HTTP API |
| **SQS** | Очередь сообщений |
| **EventBridge** | Cron, события из других сервисов |
| **DynamoDB Streams** | Реакция на изменения таблицы |

Финальный проект курса: **S3 ObjectCreated → Lambda → resize → DynamoDB**.

## IAM и VPC

- Lambda **обязана** иметь **execution role** (`lambda.amazonaws.com` + policies).
- Доступ к S3/DynamoDB — через IAM policy на role.
- Lambda **в VPC** (для RDS): нужен ENI, холодный старт дольше, нужен NAT для интернета.

Для S3 + DynamoDB VPC **не нужен** (публичные AWS API).

## API Gateway (кратко)

```text
Client HTTPS
    → API Gateway (REST / HTTP API)
    → Lambda integration
    → Response
```

HTTP API дешевле REST API. Для учебного API достаточно HTTP API или **Lambda Function URL**.

## Ограничения и антипаттерны

Не подходит для:

- Долгие CPU-задачи без разбиения (> 15 min).
- Stateful long connections (WebSocket — отдельно).
- Постоянный высокий RPS без учёта concurrency limits.

Подходит для:

- Обработка файлов, webhooks, CRUD API с низкой/средней нагрузкой.
- Glue между S3, SQS, DynamoDB.

## Пример потока (resize image)

```python
# Псевдокод handler
def handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]
        image = download_s3(bucket, key)
        thumb = resize(image, max_width=800)
        put_s3(bucket, f"thumbs/{key}", thumb)
        dynamodb.put_item(TableName="images", Item={...})
```

Зависимости: слой **Lambda Layer** (Pillow) или container image.

## Мониторинг

- **CloudWatch Logs** — stdout/stderr автоматически.
- **CloudWatch Metrics** — Invocations, Errors, Duration.
- **X-Ray** — tracing (опционально).

## Стоимость (реальный AWS)

- Первые N вызовов — Free Tier.
- Плата за GB-second и количество запросов.
- S3 GET/PUT и DynamoDB write — отдельно.

В LocalStack — без счёта.

## Чек-лист

- За что платите в Lambda, за что не платите?
- Зачем execution role?
- Когда Lambda нужен VPC?
- Назовите 3 типа trigger.
- Что такое cold start?

Следующий урок: [09-messaging.md](09-messaging.md).
