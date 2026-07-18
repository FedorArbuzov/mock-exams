# 10. Amazon OpenSearch Service (managed)

## Зачем managed, если есть Docker

Self-hosted OpenSearch ([`deploy/opensearch`](../../deploy/opensearch/README.md)) даёт полный контроль и нулевую стоимость на ноутбуке. **Amazon OpenSearch Service** (ранее Elasticsearch Service) берёт на себя:

- provisioning data nodes и (опционально) dedicated master;
- patching версии движка;
- multi-AZ и автоматические snapshot в S3;
- интеграцию с **IAM**, **VPC**, **CloudWatch**, **KMS**.

Платите за instance hours, storage (EBS) и исходящий трафик — см. калькулятор и [aws-advanced/25-cost-optimization](../aws-advanced/25-cost-optimization.md).

## Архитектура domain

```text
                    ┌─────────────────────────────┐
  App / Lambda      │  VPC domain endpoint        │
  (private subnet)──►  HTTPS :443                 │
                    │  FGAC / IAM optional        │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Data nodes (r6g, etc.)     │
                    │  EBS gp3                    │
                    └─────────────┬───────────────┘
                                  │ automated snapshot
                    ┌─────────────▼───────────────┐
                    │  S3 (service-linked)        │
                    └─────────────────────────────┘
```

| Решение при создании | Рекомендация |
|----------------------|--------------|
| **VPC vs public** | Production: **только VPC**, без public access |
| **Dedicated master** | Кластеры от ~6 data nodes или тяжёлый search |
| **Zone awareness** | `3 AZ` для production |
| **Instance type** | Memory-optimized (r6g) для indexing/search mix |
| **UltraWarm / Cold** | Старые индексы дешевле (аналог warm tier) |

Обзор managed БД в AWS — [aws-basic/07-databases](../aws-basic/07-databases.md) (строка OpenSearch для full-text).

## Сеть и доступ

- Domain в **private subnet**; приложения в тех же VPC или через **VPC peering / Transit Gateway** ([aws-advanced/07-transit-gateway](../aws-advanced/07-transit-gateway.md)).
- **Interface VPC endpoint** для вызова API без выхода в интернет — концептуально рядом с PrivateLink ([aws-advanced/09-route53-privatelink](../aws-advanced/09-route53-privatelink.md)).
- Security group: ingress **только** от SG приложений и bastion; не `0.0.0.0/0`.

## Безопасность в облаке

| Слой | Практика |
|------|----------|
| Transport | HTTPS enforced |
| Auth | **Fine-grained access control** + master user в Secrets Manager **или** IAM SigV4 для programmatic |
| Encryption at rest | KMS CMK ([aws-advanced/19-kms-advanced](../aws-advanced/19-kms-advanced.md)) |
| Encryption in transit | TLS 1.2+ |
| Audit | CloudTrail на API управления domain; OpenSearch audit logs в CloudWatch Logs |

Сопоставьте с [09-security-overview.md](09-security-overview.md): те же FGAC-роли, но master user не в `.env` репозитория.

## Ingest в AWS

| Источник | Путь |
|----------|------|
| CloudWatch Logs subscription | Lambda → bulk OpenSearch |
| Kinesis Data Firehose | Managed delivery, buffering, retry |
| MSK / self-hosted Kafka | Lambda, Flink, или **Kafka Connect** OpenSearch sink |
| S3 | S3 event → Lambda |

Паттерн «Kafka как буфер» — [kafka-intermediate](../kafka-intermediate/README.md); Firehose — managed альтернатива без своего consumer group.

## ISM и шаблоны

API **совместим** с локальным стендом: те же `_index_template`, `_plugins/_ism/policies`. Политики из [examples/ism-policy-snippet.json](examples/ism-policy-snippet.json) переносятся с учётом **реального** retention (30/90 дней) и **snapshot** state перед delete.

## Observability managed domain

- **CloudWatch metrics:** `ClusterStatus.red`, `FreeStorageSpace`, `CPUUtilization`, `JVMMemoryPressure`.
- **Алерты** — SNS → PagerDuty (как Alertmanager в [observability-intermediate/09-alertmanager-routing](../observability-intermediate/09-alertmanager-routing.md)).
- **Логи** самого OpenSearch — в CloudWatch Logs; не путать с индексируемыми application logs.

Разделение: **метрики** domain в CloudWatch, **логи приложений** — в indices OpenSearch или параллельно в S3 для compliance.

## Когда Loki, когда OpenSearch

| Критерий | OpenSearch Service | Loki (+ Prometheus) |
|----------|-------------------|---------------------|
| Полнотекст, сложный DSL | Сильная сторона | Слабее |
| Единый стек с AWS | Нативно | Самостоятельный Helm |
| Стоимость при высоком объёме | Выше при плохом ISM/shard design | Ниже при label discipline |
| Команда знает Kibana/Dashboards | Да | Grafana |

Подробнее — [observability-intermediate/03-loki-logql](../observability-intermediate/03-loki-logql.md).

## Миграция lab → AWS (обзор)

1. Поднять domain 2.x, включить FGAC.
2. `PUT _index_template` и ISM из репозитория.
3. Переключить ingest endpoint (Firehose / Connect).
4. Reindex historical при необходимости (`_reindex` remote → local).
5. Dashboards saved objects export/import.

## Чек-лист

- [ ] Понимаете trade-off managed vs self-hosted.
- [ ] Назвали три сетевых/ security требования для VPC domain.
- [ ] Связали Kafka/Firehose ingest с курсом kafka-intermediate.

**Дальше:** [11-final-project.md](11-final-project.md).
