# 35. Top 40 AWS + boto3 interview Q&A

Preparation for a **Middle+ Python / Backend** interview. Answers are detailed, with references to the course. Cheatsheet — [interview-cheatsheet](interview-cheatsheet.md).

---

## 1. What are boto3 Session, Client, Resource?

**Session** holds credentials and region. **Client** — low-level API (dict responses). **Resource** — object-oriented wrapper (Table, Bucket). One session — many clients. See [02-session-client-resource](02-session-client-resource.md).

---

## 2. How does boto3 find credentials?

Credential chain: env vars → shared config `~/.aws/credentials` → IAM role (EC2/ECS/Lambda). Explicit credentials in code — anti-pattern. Lab: dummy `test/test`. See [04-config-endpoints-localstack](04-config-endpoints-localstack.md).

---

## 3. Why endpoint_url?

For LocalStack/custom gateway: `client("s3", endpoint_url="http://localhost:4566")`. Without it — real AWS. In the stack — [`settings.endpoint_url`](../../deploy/python-aws/stack/shop_aws/config.py).

---

## 4. ClientError vs ConnectionError?

**ClientError** — AWS returned an error code (`NoSuchBucket`, `AccessDenied`). **ConnectionError** — network/DNS/timeout. Retry idempotent ops only. See [06-errors-retries-paginators](06-errors-retries-paginators.md).

---

## 5. Paginator — why?

`list_objects_v2` returns max 1000 keys — you need a pagination token. Paginator hides the loop. Without it — incomplete migrations.

---

## 6. S3 Consistency model?

Read-after-write consistency for **new** objects. Overwrite — eventual for rare listings. Not a filesystem — rename = copy+delete. See [07-s3-boto3-basics](07-s3-boto3-basics.md).

---

## 7. Presigned URL — what is it?

Signed HTTP URL for temporary upload/download without sharing AWS keys. Client uploads direct to S3. See [09-s3-advanced-presigned](09-s3-advanced-presigned.md).

---

## 8. S3 event notification destinations?

Lambda, SQS, SNS, EventBridge. At-least-once delivery. Prefix/suffix filter is required for cost. See [11-s3-events-notifications](11-s3-events-notifications.md).

---

## 9. Why unquote_plus on an S3 key?

Keys are URL-encoded in the event (`%2F`, `+`). Without decoding — `NoSuchKey`. See [23-lambda-s3-trigger](23-lambda-s3-trigger.md).

---

## 10. DynamoDB partition key design?

Hot partition if all pk share the same prefix. Spread: `USER#id`, `ORDER#date#id`. PAY_PER_REQUEST for variable load. See [13-dynamodb-boto3-crud](13-dynamodb-boto3-crud.md).

---

## 11. Query vs Scan?

**Query** — by key condition (efficient). **Scan** — full table (expensive). GSI for alternate access patterns. See [15-dynamodb-query-gsi](15-dynamodb-query-gsi.md).

---

## 12. Why conditional write?

`attribute_not_exists(pk)` — idempotent create, prevent duplicate webhook. **TransactionCanceledException** on conflict. See [18-lab-idempotent-ddb](18-lab-idempotent-ddb.md).

---

## 13. Lambda handler signature?

`def handler(event, context)`. Event shape depends on the trigger. Return for API GW: `statusCode` + string `body`. See [19-lambda-handler-basics](19-lambda-handler-basics.md).

---

## 14. Cold start — what affects it?

Package size, imports, VPC ENI, runtime init. Mitigation: slim zip, lazy imports, provisioned concurrency (cost).

---

## 15. Lambda timeout vs SQS visibility?

Visibility timeout must be **≥** max processing time. Otherwise duplicate processing. Extend with `ChangeMessageVisibility`.

---

## 16. How to deploy a Lambda zip?

Zip with package root = `shop_aws/`, `create_function(Code={"ZipFile": ...})`, execution role with trust `lambda.amazonaws.com`. See [21-lambda-deploy-packaging](21-lambda-deploy-packaging.md).

---

## 17. S3 permission to invoke Lambda?

`lambda.add_permission` Principal `s3.amazonaws.com` + bucket notification config. Order: function → permission → notification.

---

## 18. SQS at-least-once semantics?

A message may be delivered **more than once**. Delete after success + idempotent handler. Not exactly-once without a dedup layer.

---

## 19. Long polling SQS?

`WaitTimeSeconds=20` — worker blocks, fewer empty receives, lower cost. Production default.

---

## 20. SNS vs SQS?

SNS — pub/sub fan-out. SQS — queue buffer for workers. Often SNS → multiple SQS subscriptions. See [27-sns-boto3](27-sns-boto3.md).

---

## 21. SNS message in SQS — what format?

Wrapped JSON: the `Message` field contains an inner JSON string. Parse twice.

---

## 22. EventBridge vs SNS?

EventBridge — content-based rules, schedules, SaaS integration. SNS — simple multicast notify. See [29-eventbridge-boto3](29-eventbridge-boto3.md).

---

## 23. put_events Detail — dict or string?

**String** JSON in the API. Forgot to serialize → validation error.

---

## 24. Secrets Manager vs SSM?

Secrets Manager — rotation, sensitive JSON. SSM — config parameters, cheaper. Lambda fetches at runtime + IAM. See [31-secrets-ssm](31-secrets-ssm.md).

---

## 25. Why can't you log secrets?

CloudWatch logs are accessible — a full key leak = incident. Return masked preview only.

---

## 26. moto vs LocalStack?

moto — in-process fast unit tests. LocalStack — Docker multi-service integration. Disable `endpoint_url` for moto. See [33-testing-moto-localstack](33-testing-moto-localstack.md).

---

## 27. How to test a Lambda handler?

Direct call with fake event + FakeContext; moto for AWS deps. No need to deploy for unit tests.

---

## 28. IAM least privilege?

Grant minimal actions/resources. Lab `*` — never prod. Role trust policy separate from permissions policy.

---

## 29. Regional resources?

S3 bucket name global; most resources regional. Client region must match resource region.

---

## 30. DynamoDB Decimal in boto3?

Float forbidden for numbers — use `Decimal`. JSON serialization needs a custom encoder.

---

## 31. When batch_writer?

Bulk put/delete — buffered API calls. Not for conditional writes. See [17-dynamodb-batch-transactions](17-dynamodb-batch-transactions.md).

---

## 32. S3 → Lambda vs S3 → SQS → worker?

Lambda — simpler, 15 min limit. SQS — buffer spikes, DLQ, scale consumers independently.

---

## 33. Why a DLQ?

Poison messages after maxReceiveCount → dead letter queue for inspection. Without DLQ — infinite retry loop.

---

## 34. Idempotency key pattern?

Separate pk `IDEM#{key}` or conditional put before side effects. Critical for webhooks and SQS.

---

## 35. Recursive S3 Lambda loop?

Lambda writes to the same bucket without a filter → triggers itself. Fix: prefix filter or separate bucket.

---

## 36. API Gateway Lambda proxy response?

`body` must be a **string** (JSON.dumps). Dict body → 502.

---

## 37. Lambda environment vs Secrets Manager?

Env visible in console/config snapshot. Secrets fetched at runtime — better for rotation, slightly slower cold start.

---

## 38. LocalStack limitations?

Partial parity — test happy path locally, validate critical behavior on an AWS dev account with a budget alert.

---

## 39. Celery vs SQS consumer?

Celery — app-level task framework with broker abstraction. SQS — managed queue, you write the poll loop. See [python-celery](../python-celery/01-task-queues-landscape.md).

---

## 40. Typical AWS Python capstone pipeline?

S3 upload → Lambda resize/metadata → DynamoDB; IAM least privilege; pytest moto; optional EventBridge. See [36-capstone](36-capstone.md), [aws-terraform image pipeline](../aws-terraform/23-final-project.md).

---

## Summary

The interview checks: **credential chain, idempotency, at-least-once queues, event payload shapes, IAM, testing strategy**. Practice: [36-capstone](36-capstone.md). Cheatsheet: [interview-cheatsheet](interview-cheatsheet.md).

Next: [36-capstone](36-capstone.md).
