# 08. Database per service и владение данными

## Введение

Два микросервиса и одна таблица `orders` — это **распределённый монолит** с сетевой задержкой. **Database per service** — каждый сервис владеет **приватным** хранилищем; чужие данные — через API или события.

---

## Принцип владения

| Правило | Следствие |
|---------|-----------|
| Только владелец пишет | нет cross-service SQL UPDATE |
| Чужие данные — read через контракт | API, materialized view, replica read model |
| Схема скрыта | нет shared ORM models между репо |

---

## Shared database anti-pattern

```text
[Order Svc]──┐
             ├──► [PostgreSQL orders + inventory tables]
[Inventory]──┘
```

| Проблема | Пример |
|----------|--------|
| Coupled migrations | Order team ломает Inventory |
| Неясный владелец | кто чинит deadlock |
| Scale | нельзя шардить inventory отдельно |

---

## Паттерны доступа к чужим данным

| Паттерн | Когда |
|---------|-------|
| **Sync API** | мало данных, нужна свежесть |
| **Local cache/replica** | read-heavy, допустим lag |
| **Event replication** | обновления редкие, fan-in |
| **API composition** | BFF собирает на лету |

---

## Типы БД по сервису (polyglot persistence)

| Сервис | Store | Почему |
|--------|-------|--------|
| Catalog | Postgres + Redis cache | ACID + speed |
| Search | OpenSearch | full-text |
| Session cart | Redis | TTL |
| Analytics | ClickHouse / warehouse | OLAP |

Цена: **ops экспертиза** на N систем ([postgresql-*](../postgresql-basic/README.md), [opensearch-*](../opensearch-basic/README.md)).

---

## Переходный период (strangler)

| Фаза | Data |
|------|------|
| 1 | Общая БД, разные схемы/префиксы |
| 2 | Read-only views для чужих |
| 3 | Отдельный кластер + sync |
| 4 | Полное разделение |

Явно зафиксируйте **фазу** в ADR — не застревать на фазе 1 годами.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Postgres per app | [deploy/fastapi](../../deploy/fastapi/README.md), [deploy/django](../../deploy/django/README.md) |
| N+1 cross aggregate | [sqlalchemy-deep/16](../sqlalchemy-deep/16-lab-n-plus-one.md) |
| Redis cache-aside | [redis-basic](../redis-basic/README.md) |

---

## Подзадачи

**Время:** ~55–65 мин.

### 8.1 Data ownership map (20 мин)

Таблица: entity (Order, Product, Payment) | owning service | storage | кто читает чужое (как).

### 8.2 Shared DB audit (10 мин)

Если сейчас монолит — есть ли JOIN между «будущими» сервисами? Список 3 опасных JOIN.

### 8.3 Read model (15 мин)

Inventory нужен catalog в Order svc. Выберите: sync API / cache / event replica. ADR на ½ страницы.

### 8.4 Migration phase (10 мин)

Для одной сущности опишите фазы 1–4 (из раздела выше) с датами-ориентирами.

### 8.5 Polyglot (10 мин)

Нужен ли второй тип БД одному сервису? Какой и почему (или «нет, YAGNI»).

---

## Резюме

Микросервис без своей data boundary — **модуль с HTTP**. Владение данными дороже REST, но дешевле shared schema.

---

## Чек-лист

- [ ] У каждой сущности один owner?
- [ ] Нет cross-service SQL?
- [ ] Transition phase записана?

**Дальше:** [09. Saga: оркестрация и хореография](09-saga-patterns.md).
