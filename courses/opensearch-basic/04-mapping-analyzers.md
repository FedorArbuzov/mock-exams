# 04. Mapping и analyzers: text vs keyword

## Введение: «почему фильтр по level не работает»

Инженер индексирует лог `{"level": "ERROR"}` и ищет `term` query `level: ERROR` — **0 hits**. Поле `level` оказалось **`text`**: analyzer привёл значение к `error`, токенизировал, и exact match не сработал. Рядом поле `service` сделали **`keyword`** — фильтр `service: api` работает. Эта глава — **mapping** (схема полей) и **analyzers** для логов на OpenSearch.

## Что вы узнаете

- **Dynamic mapping** vs явный mapping при создании индекса.
- Типы **`text`**, **`keyword`**, **`date`**, **`long`**, **`boolean`** для логов.
- Цепочка **character filter → tokenizer → token filter**.
- Подполя **`fields.keyword`** и суффикс `.keyword` в Query DSL.

## Mapping — схема индекса

**Mapping** определяет, как JSON-поля индексируются и ищутся.

| Режим | Поведение |
|-------|-----------|
| Dynamic (default) | новые поля угадываются при первом документе |
| Explicit | вы задаёте типы до ingest — **рекомендуется для логов** |

Пример явного mapping для логов:

```json
PUT /logs-template-demo
{
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "level": {
        "type": "text",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "service": { "type": "keyword" },
      "message": { "type": "text" },
      "status": { "type": "integer" },
      "bytes": { "type": "long" }
    }
  }
}
```

## text vs keyword

| Тип | Индексация | Запросы | Пример поля |
|-----|------------|---------|-------------|
| **text** | analyzer, inverted index по токенам | `match`, `match_phrase` | `message` |
| **keyword** | одно значение целиком | `term`, `terms`, aggregations | `service`, `level.keyword` |

**text** — полнотекст: «payment failed» найдётся по `match: payment`.  
**keyword** — точное совпадение: `term: api` для `service`.

Для полей с двойной ролью (`level`) используйте **multi-fields**: основное `text` + подполе `keyword`.

## Analyzers

**Analyzer** применяется к полям `text` при индексации и (часто) при поиске.

Стандартный **standard** analyzer для английского: lowercasing, разбиение по пробелам.

```bash
curl -s -X POST "http://localhost:9200/_analyze" \
  -H 'Content-Type: application/json' -d '{
  "analyzer": "standard",
  "text": "GET /orders 500 ERROR"
}'
```

**Что увидите:** токены `get`, `orders`, `500`, `error`.

| Analyzer | Когда |
|----------|-------|
| `standard` | общий текст, message логов |
| `keyword` | без разбиения (как тип keyword) |
| `whitespace` | минимальная нормализация |
| custom | nginx/apache grok-пайплайны (intermediate) |

**Search analyzer** можно отличать от **index analyzer** (например, synonym только при поиске).

## Даты и числа

- **`@timestamp`**: тип `date`; принимает ISO-8601. Нужен для **date_histogram** и сортировки в Dashboards.
- **`status`**, **`bytes`**: числовые типы — **range** фильтры, метрики в aggregations.
- Не индексируйте как `text` то, по чему нужен **range** (`status: 500`).

## Dynamic mapping — риски

Первый документ с `"status": "500"` (строка) зафиксирует **text**. Следующий с `"status": 500` (число) — **mapping conflict**. Для логов:

1. Создайте индекс с mapping **до** bulk.
2. Или используйте **index template** для `logs-*` (intermediate).

## _source и stored fields

По умолчанию хранится полный **`_source`** — то, что вернётся в hit. Можно отключать `_source` для экономии (редко на учебных лабах). **doc_values** для keyword/date — основа сортировок и агрегаций.

## На стенде: analyze API

```bash
curl -s -X POST "http://localhost:9200/_analyze" \
  -H 'Content-Type: application/json' -d '{
  "tokenizer": "keyword",
  "text": "ERROR"
}'
```

Сравните с `standard` на том же тексте — разное число токенов.

Практика — [05. Лаба mapping](05-lab-mapping.md).

## Типичные ошибки

| Ошибка | Симптом | Исправление |
|--------|---------|-------------|
| `term` на поле `text` | 0 hits | `level.keyword` или mapping keyword |
| `match` на `keyword` | не то поведение | `term` для exact |
| Огромный `message` как keyword | reject / огромный индекс | только `text` |
| Смешение типов в одном поле | ingest error | reindex, явный mapping |
| Игнор `@timestamp` | нет time picker | `type: date` |

## В продакшене

- **Index templates** + **Composable templates** для единообразия `logs-*`.
- **ECS** (Elastic Common Schema) — согласованные имена полей.
- **Normalizers** для keyword (lowercase без токенизации).
- Ограничение **`ignore_above`** на keyword — защита от гигантских строк.
- Не логировать секреты; mapping не исправит утечку PII.

## Заметки для собеседования

- **Inverted index** строится после analyzer для text.
- **keyword** не анализируется (или normalizer).
- **`.keyword`** — часто подполе, не отдельное поле в JSON документа.
- **Mapping update** — ограничен; смена типа = новый индекс + reindex.

## Резюме

Mapping связывает JSON лога с тем, **как** поле ищется: **text** для `message`, **keyword** для фильтров и aggregations, **date** для времени. Analyzers объясняют, почему `term` и `match` не взаимозаменяемы. Следующая лаба закрепляет `_analyze` и явный mapping.

## Чек-лист

- Когда использовать `text`, когда `keyword`?
- Зачем подполе `fields.keyword`?
- Чем `term` отличается от `match`?
- Какой тип у `@timestamp` в типовом mapping логов?

Следующий урок: [05. Лаба: mapping](05-lab-mapping.md).
