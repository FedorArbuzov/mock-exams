# 10. Логи и Bulk API: NDJSON, refresh

## Введение: «один POST на тысячу строк»

Агент логов шлёт **тысячи событий в секунду**. Отдельный HTTP `POST /_doc` на каждую строку — latency и нагрузка на кластер. **Bulk API** упаковвает операции в один body формата **NDJSON** (newline-delimited JSON): строка action, строка source, повтор. После вечернего bulk инженер делает **`_refresh`** и видит документы в Discover. Эта глава — ingest логов так, как на стенде работает [`scripts/bulk-sample.sh`](../../deploy/opensearch/scripts/bulk-sample.sh).

## Что вы узнаете

- Формат **`_bulk`**: `index`, `create`, `update`, `delete`.
- **Content-Type** и `--data-binary` в curl.
- Параметры **`refresh`**, явный **`POST /index/_refresh`**.
- Именование индексов логов **`logs-app-YYYYMMDD`**.

## Один документ vs bulk

| | POST /index/_doc | POST /_bulk |
|---|------------------|-------------|
| Объём | 1 документ | тысячи за запрос |
| Overhead | высокий | низкий |
| Ответ | один `_id` | `items[]`, `errors` flag |
| Лабы | mapping, поиск | реалистичные логи |

## Формат NDJSON

Каждая операция — **две строки** (минимум для index):

```text
{"index":{"_index":"logs-app-20260518","_id":"optional-id"}}
{"@timestamp":"2026-05-18T10:00:01Z","level":"info","message":"..."}
```

Правила:

- Одна JSON-запись = **одна строка**, завершённая `\n`.
- Последняя строка тоже с `\n`.
- Нельзя pretty-print bulk body в один многострочный JSON.

Образец в репозитории: [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample).

## curl

```bash
curl -sf -X POST "http://localhost:9200/_bulk" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @examples/bulk-ndjson.sample
```

`--data-binary` сохраняет переводы строк; без этого bulk ломается.

На стенде готовый скрипт:

```bash
cd deploy/opensearch
bash scripts/bulk-sample.sh
```

Переменные: `OS` (default `http://localhost:9200`), `IDX` (default `logs-app-$(date +%Y%m%d)`).

## Ответ bulk

```json
{
  "errors": false,
  "items": [
    { "index": { "_index": "...", "_id": "...", "status": 201, "result": "created" } }
  ]
}
```

| status | Значение |
|--------|----------|
| 201 | created |
| 200 | updated (повтор с тем же _id) |
| 409 | version conflict |

При `errors: true` — просмотрите `items[].index.error` (mapping conflict, disk full).

## Refresh и видимость

После bulk документы могут быть **не сразу** в search. Варианты:

| Способ | Когда |
|--------|-------|
| `POST /index/_refresh` | лабы, тесты |
| `?refresh=wait_for` на bulk | ждать в том же запросе |
| default periodic refresh | ~1s в фоне |

```bash
curl -sf -X POST "http://localhost:9200/logs-app-20260518/_refresh"
```

**Не** ставьте `refresh=true` на каждый production bulk — нагрузка на кластер.

## Mapping перед bulk

Для предсказуемых полей создайте индекс **до** первой строки (см. [04. Mapping](04-mapping-analyzers.md)) или используйте template. Скрипт `bulk-sample.sh` пишет в **новый** индекс дня — dynamic mapping сработает для учебных полей `level`, `service`, `message`, `status`, `bytes`.

## Индексация логов nginx-style

Типичные поля (как в bulk-sample):

| Поле | Тип (рекомендация) |
|------|---------------------|
| `@timestamp` | date |
| `level` | text + keyword |
| `service` | keyword |
| `message` | text |
| `status` | integer |
| `bytes` | long |

Пайплайны **ingest** (grok, rename) — [opensearch-intermediate](../opensearch-intermediate/README.md).

## Поиск после bulk

```bash
curl -s "http://localhost:9200/logs-app-*/_search?q=level:error&pretty"
curl -s -X GET "http://localhost:9200/logs-app-*/_search" \
  -H 'Content-Type: application/json' -d '{"size":5,"sort":[{"@timestamp":"desc"}]}'
```

Wildcard `logs-app-*` — все дневные индексы (осторожно с производительностью в огромных кластерах; в проде — **alias**).

## Типичные ошибки

| Ошибка | Симптом | Исправление |
|--------|---------|-------------|
| Один JSON вместо NDJSON | 400 parse error | две строки на документ |
| Забыли `\n` в конце | partial parse | trailing newline |
| `Content-Type: application/json` | иногда OK, риск | `application/x-ndjson` |
| Огромный bulk файл | timeout | батчи 5–15 MB |
| Индекс без места | 429 / cluster_block | disk watermark, ISM |

## В продакшене

- **Bulk thread pool** — мониторинг `rejected` count.
- **Ingest node** + pipeline вместо предобработки на агенте (где уместно).
- **Data streams** (Elasticsearch 7.9+, OpenSearch аналоги) — упрощение rollover.
- Агенты: **Fluent Bit** `opensearch` output, **Vector** `elasticsearch` sink.
- **Compression** HTTP при больших телах (intermediate).

## Заметки для собеседования

- Bulk — **не транзакция** целиком: часть items может упасть.
- **Idempotent** ingest: стабильный `_id` (hash строки) против дубликатов.
- **Near real-time** — refresh, не fsync.
- Loki принимает **streams**, не bulk NDJSON — другая модель ingest.

## Резюме

Bulk API — стандарт загрузки логов: **NDJSON**, action line + source line, батчи через curl или агент. После учебного bulk — **`_refresh`** и поиск по `logs-app-*`. Следующая лаба повторяет скрипт стенда и расширяет данные.

## Чек-лист

- Сколько строк NDJSON на один indexed документ?
- Зачем `--data-binary`?
- Что делает `bulk-sample.sh` на стенде?
- Почему не refresh=true на каждый bulk в проде?

Следующий урок: [11. Лаба: bulk-логи](11-lab-bulk-logs.md).
