# 07. Версионирование и обратная совместимость

## Введение

«Мы только добавили поле» — а мобильный клиент упал, потому что парсер не терпит unknown keys. Версия API — **обещание**; breaking change без v2 — технический долг с процентами.

---

## Стратегии версий

| Стратегия | Пример | Когда |
|-----------|--------|-------|
| URL path | `/api/v1/orders` | default для публичных API |
| Header | `Api-Version: 2024-06-01` | Stripe-style date versions |
| Accept | `application/vnd.acme.v2+json` | строгий REST |
| Нет версии | только compatible changes | внутренние сервисы за mesh |

Подробная реализация: [fastapi/39](../fastapi/39-versioning-idempotency.md).

---

## Compatible vs breaking

| Изменение | Compatible? |
|-----------|-------------|
| Добавить **optional** поле в ответ | да |
| Добавить optional query param | да |
| Добавить новый эндпоинт | да |
| Удалить поле из ответа | **breaking** |
| Переименовать поле | **breaking** |
| Изменить тип (`string` → `number`) | **breaking** |
| Сделать optional поле required в request | **breaking** |
| Изменить семантику 200 | **breaking** |

**Правило клиентов:** игнорировать неизвестные поля (Postel's law). **Правило сервера:** не ломать старых без новой версии.

---

## Parallel run v1 и v2

```text
Phase 1: v1 frozen (bugfix only), v2 новые фичи
Phase 2: v1 deprecated (headers + docs)
Phase 3: v1 sunset (метрики < 1% RPS)
Phase 4: v1 off
```

| Заголовок | Значение |
|-----------|----------|
| `Deprecation` | `true` |
| `Sunset` | `Sat, 01 Jan 2028 00:00:00 GMT` |
| `Link` | `<.../migration>; rel="deprecation"` |

---

## OpenAPI diff в CI

На каждый PR:

- удалённые поля → fail
- изменённый `type` → fail
- новый required в request → fail
- добавлен optional → pass

Инструменты: `openapi-diff`, `oasdiff`, [fastapi/32](../fastapi/32-contract-tests.md).

---

## Миграция клиентов

Документ **Migration guide v1 → v2**:

1. Таблица mapping полей
2. Сроки sunset
3. Примеры запросов до/после
4. Sandbox с v2

---

## Версия БД ≠ версия API

Миграция схемы Postgres может быть **внутренней**; API остаётся v1 через mapping слой. Не expose «мы переехали на таблицу orders_v2».

---

## Feature flags vs версия

| | API version | Feature flag |
|--|-------------|--------------|
| Контракт | фиксирован в spec | может меняться daily |
| Аудитория | все клиенты v2 | subset пользователей |
| Документация | OpenAPI v2 | internal |

Флаги для **поведения** внутри версии; не замена breaking path change.

---

## В mock-exams

| Тема | Курс |
|------|------|
| `/api/v1` routers | [fastapi/39](../fastapi/39-versioning-idempotency.md) |
| Contract diff | [fastapi/32](../fastapi/32-contract-tests.md) |
| Capstone v2 | [fastapi/42](../fastapi/42-capstone.md) |

---

## Резюме

Версия — **граница обещаний**. Compatible расширяйте в v1; breaking — только в v2 с sunset и метриками usage.

---

## Чек-лист

- [ ] Есть политика compatible changes?
- [ ] Sunset headers на deprecated paths?
- [ ] OpenAPI diff в CI?

**Дальше:** [08. Идемпотентность, повторы и rate limit](08-idempotency-retries.md).
