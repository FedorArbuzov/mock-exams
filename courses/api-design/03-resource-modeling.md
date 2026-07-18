# 03. Моделирование ресурсов и URL

## Введение

URL живут годами: их логируют, кэшируют, вшивают в мобильные приложения. Плохая модель ресурсов дороже, чем «не тот фреймворк» — менять пути после релиза больно.

---

## Существительные, не глаголы

```text
Хорошо                          Плохо
──────                          ─────
GET  /users/{id}                GET  /getUser?id=...
POST /orders                    POST /createOrder
POST /orders/{id}/cancel        GET  /cancelOrder?orderId=...
```

Исключение: **действия**, которые не укладываются в поля ресурса — `POST /payments/{id}/capture` (capture — переход state machine).

---

## Коллекции и элементы

```text
/orders              коллекция
/orders/{order_id}   элемент
/orders/{order_id}/items   вложенная коллекция
```

| Паттерн | Когда |
|---------|-------|
| Вложенный URL | элемент **принадлежит** родителю; без parent бессмыслен |
| Плоский URL `/order-items?order_id=` | нужны cross-order запросы, админка |
| Оба | v1 вложенный, v2 плоский + filter (с migration guide) |

**Правило:** если `GET /items/{id}` достаточно — не заставляйте клиента знать `order_id`.

---

## Идентификаторы

| Тип | Пример | Плюсы / минусы |
|-----|--------|----------------|
| Auto-increment int | `42` | просто; утечка объёма; слабая федерация |
| UUID v4 | `550e8400-e29b-...` | непредсказуем; длинный URL |
| ULID / KSUID | `01ARZ3NDEKTSV4RRFFQ69G5FAV` | сортируемость по времени |
| Slug | `acme-corp` | читаемо; смена имени ломает URL |
| Prefixed id | `ord_01H...` | тип в логах, Stripe-style |

**Публичный API:** opaque string id; **не** expose внутренний surrogate key БД без нужды.

---

## Связи many-to-many

```text
/users/{id}/groups          membership как sub-resource
/groups/{id}/users
```

Дублирование entry points допустимо, если **симметричный доступ** (админ группы vs профиль пользователя). Документируйте канонический путь для записи.

---

## Массовые операции

| Подход | Пример |
|--------|--------|
| Batch endpoint | `POST /orders/batch` с массивом |
| Async job | `POST /imports` → `202` + `job_id` — [11-async-webhooks](11-async-webhooks.md) |
| Несколько PATCH | клиент сам — если объём мал |

Не делайте `GET /orders?ids=1,2,3,...,500` для мутаций.

---

## Поиск и фильтрация

```http
GET /products?q=laptop&category=electronics&sort=-price&limit=20
```

- **Фильтры** — query params на коллекции ([05-pagination-filtering](05-pagination-filtering.md))
- **Сложный поиск** — `POST /products/search` с телом (осторожно: не кэшируется как GET)

---

## Версия в URL

```text
/api/v1/orders
/api/v2/orders
```

Prefix `/api/v1` — практичный default ([07-versioning-compatibility](07-versioning-compatibility.md)). Ресурсы **внутри** версии стабильны.

---

## Соглашения именования

| Решение | Рекомендация |
|---------|--------------|
| `kebab-case` vs `snake_case` в path | **kebab-case** в URL: `/order-items` |
| Поля JSON | **snake_case** (Python/Postgres) или **camelCase** (JS) — **одно** на API |
| Множественное число | `/orders`, не `/order` |
| Trailing slash | выберите политику; 301 redirect или 404 на mismatch |

---

## В mock-exams

| Тема | Курс |
|------|------|
| CRUD ресурсов | [fastapi/06](../fastapi/06-lab-crud.md), [django/07](../django/07-models-basics.md) |
| Вложенные serializers | [django/24](../django/24-lab-serializers.md) |
| APIRouter prefix | [fastapi/08](../fastapi/08-project-structure.md) |

---

## Резюме

URL — **модель домена**, не отражение таблиц БД 1:1. Коллекции, стабильные id, явные правила вложенности и именования снижают стоимость v2.

---

## Чек-лист

- [ ] Есть ли глаголы в path?
- [ ] Id публичные и непредсказуемые?
- [ ] Вложенность отражает ownership?

**Дальше:** [04. OpenAPI: contract-first и code-first](04-openapi-contracts.md).
