# 11. CQRS и read models

## Введение

Один модель `Order` и на запись, и на отчёт с 12 JOIN — **узкое место**. **CQRS** разделяет **command side** (изменения) и **query side** (чтение), часто с разными хранилищами.

---

## Command vs Query

| Command | Query |
|---------|-------|
| меняет состояние | только читает |
| валидация, инварианты | денормализация OK |
| `PlaceOrder` | `GetOrderSummary` |
| обычно OLTP store | может быть cache, search index |

**Не обязательно** разные сервисы — иногда модули в одном deploy.

---

## Read model (projection)

```text
OrderPaid event → update order_summary_view
                → update customer_totals_view
                → index in OpenSearch
```

| Projection | Назначение |
|------------|------------|
| List view | пагинация админки |
| Dashboard | агрегаты |
| Search | full-text |

**Eventual lag** между write и read — документируйте (секунды?).

---

## Когда CQRS оправдан

| Сигнал | Пример |
|--------|--------|
| Read/write ratio экстремальный | catalog 1000:1 |
| Разные формы read | mobile vs admin |
| Тяжёлые отчёты мешают OLTP | вынести в replica/OLAP |

| Не нужен | |
|----------|--|
| CRUD 50/50 | обычный Postgres + индексы |
| Команда < 5 | overhead |

---

## Sync CQRS lite

Без событий: **read replica** Postgres + materialized view refresh ([postgresql-intermediate](../postgresql-intermediate/README.md)).

---

## Invalidation и consistency

| Вопрос клиента | Ответ |
|----------------|-------|
| «Оплатил — почему в списке pending?» | lag + UI polling/SSE |
| «Сколько на складе?» | sync read если критично |

Показывайте **version** или `updated_at` в UI.

---

## Anti-pattern: CQRS everywhere

Десять projection на каждую сущность → ops кошмар. Начните с **одного** hot read path.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Pagination API | [fastapi/17](../fastapi/17-pagination-filters.md) |
| OpenSearch | [opensearch-basic](../opensearch-basic/README.md) |
| Redis cache | [fastapi/28](../fastapi/28-redis-cache.md) |

---

## Подзадачи

**Время:** ~55–65 мин.

### 11.1 Read/write split (15 мин)

Для Catalog: перечислите 3 command и 5 query. Какие query тяжёлые?

### 11.2 Projection design (20 мин)

Спроектируйте `product_list_view` (поля, источник обновления, lag SLA).

### 11.3 CQRS decision (10 мин)

Таблица критериев: ваш score → CQRS full / lite / no.

### 11.4 UX lag (10 мин)

Сценарий «после оплаты список заказов» — как UI обрабатывает 2s lag?

### 11.5 Rejected (10 мин)

Почему не дублируете все таблицы в Elasticsearch «на всякий случай»?

---

## Резюме

CQRS — **оптимизация read path**, не религия. Projection + явный lag SLA; начинайте с узкого места.

---

## Чек-лист

- [ ] Hot read path идентифицирован?
- [ ] Lag SLA для пользователя?
- [ ] Не больше N projections на старте?

**Дальше:** [12. CAP, eventual consistency](12-consistency-cap.md).
