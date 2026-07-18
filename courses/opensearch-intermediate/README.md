# OpenSearch — Intermediate

Промежуточный курс по **OpenSearch 2.x**: **index templates**, **ingest pipelines** (Grok, Set), **Index State Management (ISM)**, **шарды и реплики**, **здоровье кластера**, обзор **безопасности (FGAC, TLS)**, **Amazon OpenSearch Service** и **финальный проект** в стиле ELK-пайплайна.

Формат — «книжные» главы на русском: теория → лабораторная работа на локальном стенде [`deploy/opensearch`](../../deploy/opensearch/README.md).

## Для кого

- Понимаете, что такое **индекс**, **документ**, **mapping** и базовый **search DSL** (уровень [opensearch-basic](../opensearch-basic/README.md) или эквивалент из документации Elastic/OpenSearch).
- Умеете работать с `curl` и Docker Compose.
- Полезно параллельно: [kafka-intermediate](../kafka-intermediate/README.md) (поток логов, Connect) и [observability-intermediate](../observability-intermediate/README.md) (метрики vs логи, Loki).

## Стенд

```bash
cd deploy/opensearch
docker compose up -d
docker compose ps
```

| Сервис | URL |
|--------|-----|
| OpenSearch API | http://localhost:9200 |
| OpenSearch Dashboards | http://localhost:5601 |

На учебном стенде **`DISABLE_SECURITY_PLUGIN=true`** — API без TLS и пароля. В продакшене это недопустимо; см. [09-security-overview.md](09-security-overview.md).

**Ресурсы:** Docker **2+ ГБ RAM**; первый старт кластера — 40–90 с до `healthy`.

```bash
bash deploy/opensearch/scripts/smoke.sh
bash deploy/opensearch/scripts/bulk-sample.sh
```

## Связанные курсы и стенды

| Курс / стенд | Зачем |
|--------------|-------|
| [kafka-intermediate](../kafka-intermediate/README.md) | Паттерн **log aggregation**: topic → consumer/indexer → OpenSearch ([kafka-basic/12-patterns](../kafka-basic/12-patterns.md)); Connect — [15-kafka-connect](../kafka-intermediate/15-kafka-connect.md). |
| [observability-intermediate](../observability-intermediate/README.md) | **Метрики** (Prometheus) и **логи** (Loki) — разделение столпов; сравнение Loki vs ELK — [03-loki-logql](../observability-intermediate/03-loki-logql.md). |
| [observability-basic/11-logs-preview](../observability-basic/11-logs-preview.md) | Зачем централизовать логи до выбора стека. |
| [aws-basic/07-databases](../aws-basic/07-databases.md) | Managed OpenSearch в AWS. |
| [aws-advanced](../aws-advanced/README.md) | VPC, PrivateLink, KMS — для изолированного домена OpenSearch в облаке. |

## Программа

| № | Теория | Лаба |
|---|--------|------|
| 01 | [Index templates и mappings](01-index-templates.md) | [02](02-lab-templates.md) |
| 03 | [Ingest pipelines: Grok, Set](03-ingest-pipelines.md) | [04](04-lab-ingest-pipeline.md) |
| 05 | [ISM: жизненный цикл индексов](05-index-lifecycle-ism.md) | [06](06-lab-ism-rollover.md) |
| 07 | [Шарды, реплики, routing](07-shards-replicas.md) | [08](08-lab-cluster-health.md) |
| 09 | [Безопасность: FGAC, TLS](09-security-overview.md) | tabletop |
| 10 | [Managed: Amazon OpenSearch Service](10-managed-opensearch.md) | — |
| 11 | [Финальный проект: ingest + dashboard + ISM](11-final-project.md) | — |

## Примеры в репозитории

| Путь | Назначение |
|------|------------|
| [examples/index-template-logs.json](examples/index-template-logs.json) | Шаблон для `logs-app-*` |
| [examples/ism-policy-snippet.json](examples/ism-policy-snippet.json) | Укороченная ISM-политика |
| [`deploy/opensearch/examples/ingest-pipeline-nginx.json`](../../deploy/opensearch/examples/ingest-pipeline-nginx.json) | Pipeline: Grok по полю `message` |
| [`deploy/opensearch/examples/ism-logs-policy.json`](../../deploy/opensearch/examples/ism-logs-policy.json) | ISM: hot → delete через 7d |

## Оценка времени

| Блок | Часы |
|------|------|
| Templates + ingest (01–04) | 4–5 |
| ISM + кластер (05–08) | 4–5 |
| Security + managed (09–10) | 2–3 |
| Финальный проект (11) | 3–5 |
| **Итого** | **~13–18 ч** |

## Чек-лист выпускника

- [ ] Создаёте **index template** с mapping и settings; понимаете `priority` и `index_patterns`.
- [ ] Регистрируете **ingest pipeline**, применяете **Grok** и **Set**, проверяете `_ingest`.
- [ ] Пишете **ISM policy** (состояния, transitions, `ism_template`) и объясняете отличие от «ручного» удаления индексов.
- [ ] Читаете **`_cluster/health`**, **`_cat/shards`**, связываете yellow/red с репликами и диском.
- [ ] Описываете **FGAC**, TLS и роли для Dashboards (без отключения security в prod).
- [ ] Собираете **сквозной пайплайн**: сырые логи → ingest → поиск в Dashboards → ISM.

## Дальше

- Углубление в кластер (multi-node, snapshot, cross-cluster) — отдельный advanced-трек.
- Альтернатива по логам на том же стенде observability — Loki + Promtail ([observability-intermediate](../observability-intermediate/README.md)).
