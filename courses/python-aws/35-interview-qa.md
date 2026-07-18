# 35. Top 40 AWS + boto3 interview Q&A

Подготовка к собеседованию **Middle+ Python / Backend**. Ответы развёрнутые, с отсылками к курсу. Шпаргалка — [interview-cheatsheet](interview-cheatsheet.md).

---

## 1. Что такое boto3 Session, Client, Resource?

**Session** хранит credentials и region. **Client** — low-level API (dict responses). **Resource** — object-oriented wrapper (Table, Bucket). Один session — many clients. См. [02-session-client-resource](02-session-client-resource.md).

---

## 2. Как boto3 находит credentials?

Credential chain: env vars → shared config `~/.aws/credentials` → IAM role (EC2/ECS/Lambda). Explicit в коде — anti-pattern. Lab: dummy `test/test`. См. [04-config-endpoints-localstack](04-config-endpoints-localstack.md).

---

## 3. Зачем endpoint_url?

Для LocalStack/custom gateway: `client("s3", endpoint_url="http://localhost:4566")`. Без него — real AWS. В стеке — [`settings.endpoint_url`](../../deploy/python-aws/stack/shop_aws/config.py).

---

## 4. ClientError vs ConnectionError?

**ClientError** — AWS вернул error code (`NoSuchBucket`, `AccessDenied`). **ConnectionError** — сеть/DNS/timeout. Retry только idempotent ops. См. [06-errors-retries-paginators](06-errors-retries-paginators.md).

---

## 5. Paginator — зачем?

`list_objects_v2` возвращает max 1000 keys — нужен pagination token. Paginator скрывает loop. Без него — incomplete migrations.

---

## 6. S3 Consistency model?

Read-after-write consistency для **new** objects. Overwrite — eventual для rare listings. Не filesystem — rename = copy+delete. См. [07-s3-boto3-basics](07-s3-boto3-basics.md).

---

## 7. Presigned URL — что это?

Signed HTTP URL для временного upload/download без sharing AWS keys. Client uploads direct to S3. См. [09-s3-advanced-presigned](09-s3-advanced-presigned.md).

---

## 8. S3 event notification destinations?

Lambda, SQS, SNS, EventBridge. At-least-once delivery. Filter prefix/suffix обязателен для cost. См. [11-s3-events-notifications](11-s3-events-notifications.md).

---

## 9. Почему unquote_plus на S3 key?

Keys URL-encoded в event (`%2F`, `+`). Без decode — `NoSuchKey`. См. [23-lambda-s3-trigger](23-lambda-s3-trigger.md).

---

## 10. DynamoDB partition key design?

Hot partition если все pk одинаковые prefix. Spread: `USER#id`, `ORDER#date#id`. PAY_PER_REQUEST для variable load. См. [13-dynamodb-boto3-crud](13-dynamodb-boto3-crud.md).

---

## 11. Query vs Scan?

**Query** — по key condition (efficient). **Scan** — full table (expensive). GSI для alternate access patterns. См. [15-dynamodb-query-gsi](15-dynamodb-query-gsi.md).

---

## 12. Conditional write зачем?

`attribute_not_exists(pk)` — idempotent create, prevent duplicate webhook. **TransactionCanceledException** on conflict. См. [18-lab-idempotent-ddb](18-lab-idempotent-ddb.md).

---

## 13. Lambda handler signature?

`def handler(event, context)`. Event shape зависит от trigger. Return для API GW: `statusCode` + string `body`. См. [19-lambda-handler-basics](19-lambda-handler-basics.md).

---

## 14. Cold start — что влияет?

Package size, imports, VPC ENI, runtime init. Mitigation: slim zip, lazy imports, provisioned concurrency (cost).

---

## 15. Lambda timeout vs SQS visibility?

Visibility timeout должен быть **≥** max processing time. Иначе duplicate processing. Extend with `ChangeMessageVisibility`.

---

## 16. Как deploy Lambda zip?

Zip с package root = `shop_aws/`, `create_function(Code={"ZipFile": ...})`, execution role with trust `lambda.amazonaws.com`. См. [21-lambda-deploy-packaging](21-lambda-deploy-packaging.md).

---

## 17. S3 permission для invoke Lambda?

`lambda.add_permission` Principal `s3.amazonaws.com` + bucket notification config. Order: function → permission → notification.

---

## 18. SQS at-least-once semantics?

Message может доставиться **более одного раза**. Delete после success + idempotent handler. Не exactly-once без dedup layer.

---

## 19. Long polling SQS?

`WaitTimeSeconds=20` — worker blocks, меньше empty receives, lower cost. Production default.

---

## 20. SNS vs SQS?

SNS — pub/sub fan-out. SQS — queue buffer workers. Often SNS → multiple SQS subscriptions. См. [27-sns-boto3](27-sns-boto3.md).

---

## 21. SNS message в SQS — формат?

Wrapped JSON: поле `Message` содержит string inner JSON. Parse twice.

---

## 22. EventBridge vs SNS?

EventBridge — content-based rules, schedules, SaaS integration. SNS — simple multicast notify. См. [29-eventbridge-boto3](29-eventbridge-boto3.md).

---

## 23. put_events Detail — dict или string?

**String** JSON в API. Forgot serialize → validation error.

---

## 24. Secrets Manager vs SSM?

Secrets Manager — rotation, sensitive JSON. SSM — config parameters, cheaper. Lambda fetch at runtime + IAM. См. [31-secrets-ssm](31-secrets-ssm.md).

---

## 25. Нельзя логировать secrets?

CloudWatch logs accessible — full key leak = incident. Return masked preview only.

---

## 26. moto vs LocalStack?

moto — in-process fast unit tests. LocalStack — Docker multi-service integration. Disable `endpoint_url` for moto. См. [33-testing-moto-localstack](33-testing-moto-localstack.md).

---

## 27. Как тестировать Lambda handler?

Direct call with fake event + FakeContext; moto for AWS deps. No need deploy for unit tests.

---

## 28. IAM least privilege?

Grant minimal actions/resources. Lab `*` — never prod. Role trust policy separate from permissions policy.

---

## 29. Regional resources?

S3 bucket name global; most resources regional. Client region must match resource region.

---

## 30. DynamoDB Decimal in boto3?

Float forbidden for numbers — use `Decimal`. JSON serialization needs custom encoder.

---

## 31. batch_writer когда?

Bulk put/delete — buffered API calls. Not for conditional writes. См. [17-dynamodb-batch-transactions](17-dynamodb-batch-transactions.md).

---

## 32. S3 → Lambda vs S3 → SQS → worker?

Lambda — simpler, 15 min limit. SQS — buffer spikes, DLQ, scale consumers independently.

---

## 33. DLQ зачем?

Poison messages after maxReceiveCount → dead letter queue for inspection. Without DLQ — infinite retry loop.

---

## 34. Idempotency key pattern?

Separate pk `IDEM#{key}` or conditional put before side effects. Critical for webhooks and SQS.

---

## 35. Recursive S3 Lambda loop?

Lambda writes same bucket without filter → triggers itself. Fix: prefix filter or separate bucket.

---

## 36. API Gateway Lambda proxy response?

`body` must be **string** (JSON.dumps). Dict body → 502.

---

## 37. Lambda environment vs Secrets Manager?

Env visible in console/config snapshot. Secrets fetched runtime — better for rotation, slightly slower cold start.

---

## 38. LocalStack limitations?

Partial parity — test happy path locally, validate critical behavior on AWS dev account with budget alert.

---

## 39. Celery vs SQS consumer?

Celery — app-level task framework with broker abstraction. SQS — managed queue, you write poll loop. См. [python-celery](../python-celery/01-task-queues-landscape.md).

---

## 40. Типичный capstone AWS Python pipeline?

S3 upload → Lambda resize/metadata → DynamoDB; IAM least privilege; pytest moto; optional EventBridge. См. [36-capstone](36-capstone.md), [aws-terraform image pipeline](../aws-terraform/23-final-project.md).

---

## Резюме

Собеседование проверяет: **credential chain, idempotency, at-least-once queues, event payload shapes, IAM, testing strategy**. Практика: [36-capstone](36-capstone.md). Шпаргалка: [interview-cheatsheet](interview-cheatsheet.md).

Далее: [36-capstone](36-capstone.md).
