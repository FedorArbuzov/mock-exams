# 05. Списки: пагинация, фильтры, сортировка

## Введение

`GET /orders` вернул 2 миллиона записей — упал и сервер, и мобильный клиент. Список — отдельный **контракт**: как резать данные, как фильтровать и как не сломать производительность БД.

---

## Offset vs cursor

| | Offset `?page=3&limit=20` | Cursor `?cursor=eyJ...&limit=20` |
|--|---------------------------|-----------------------------------|
| UX | «страница 5 из 100» | «следующая порция» |
| Стабильность при вставках | дубликаты/пропуски | стабильнее при sort key |
| БД | `OFFSET` дорог на больших N | `WHERE id > $cursor` |
| Jump to page | да | нет (без отдельного API) |

**Рекомендация:** offset для админок с малыми объёмами; **cursor** для публичных лент и high-volume.

---

## Формат ответа списка

**Стиль envelope (популярен):**

```json
{
  "data": [ { "id": "ord_1", "status": "paid" } ],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIzfQ",
    "has_more": true,
    "limit": 20
  }
}
```

**Стиль headers:**

```http
Link: <.../orders?cursor=abc>; rel="next"
X-Total-Count: 1542
```

Выберите один стиль на API; не смешивайте без версии.

---

## Фильтрация

```http
GET /orders?status=paid&created_after=2024-01-01T00:00:00Z&customer_id=cus_42
```

| Правило | Пример |
|---------|--------|
| Имена полей = публичная модель | `status`, не `order_status` из БД |
| Даты в ISO 8601 UTC | `2024-06-01T12:00:00Z` |
| Множественные значения | `?status=paid,shipped` или повтор `?status=paid&status=shipped` — задокументируйте |
| Диапазоны | `price_min=10&price_max=100` |

**Лимит сложности:** whitelist фильтров — не произвольный SQL из query string.

---

## Сортировка

```http
GET /orders?sort=-created_at,status
```

| Конвенция | Значение |
|-----------|----------|
| `-field` | descending |
| `field` | ascending |
| Несколько полей | через запятую |

Default sort **обязателен** в документации (обычно `-created_at`).

---

## Поля и sparse fieldsets

```http
GET /orders?fields=id,status,total
```

Снижает payload; в OpenAPI сложнее — опционально для v2.

---

## Включение связей (expand)

```http
GET /orders/42?expand=customer,items
```

Альтернатива GraphQL для 1–2 уровней вложенности. Осторожно с N+1 — [postgresql-developer](../postgresql-developer/README.md), [sqlalchemy-deep/16](../sqlalchemy-deep/16-lab-n-plus-one.md).

---

## Ограничения

| Параметр | Типичный default | Max |
|----------|------------------|-----|
| `limit` | 20 | 100 (жёсткий cap) |
| Глубина expand | 1 | 2 |
| Длина `q` search | — | 200 символов |

Превышение limit → **clamp** до max, не 400 (или 400 — но явно в spec).

---

## Индексы БД

Каждый фильтр + sort в публичном API должен иметь **план индекса**:

```sql
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);
```

Иначе пагинация станет incident на Black Friday.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Pagination в FastAPI | [fastapi/17](../fastapi/17-pagination-filters.md), [18-lab](../fastapi/18-lab-pagination.md) |
| DRF pagination | [django/27–28](../django/27-filtering-pagination.md) |
| N+1 | [sqlalchemy-deep/15–16](../sqlalchemy-deep/15-eager-loading.md) |

---

## Резюме

Список — **продуктовый интерфейс**, не `SELECT *`. Cursor для scale, whitelist фильтров, явный sort, cap на limit.

---

## Чек-лист

- [ ] Есть max `limit`?
- [ ] Default sort задокументирован?
- [ ] Фильтры покрыты индексами?

**Дальше:** [06. Ошибки и Problem Details](06-errors-problem-details.md).
