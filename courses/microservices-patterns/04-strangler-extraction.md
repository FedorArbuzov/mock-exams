# 04. Strangler Fig и поэтапное выделение

## Введение

«Перепишем монолит за квартал» — классический провал. **Strangler Fig** (Martin Fowler): новая функциональность и постепенно старая обворачиваются **фасадом**, пока монолит не «задушен» без big bang.

---

## Strangler Fig pattern

```text
                    ┌─────────────┐
  Client ──────────►│  Facade /   │
                    │  API GW     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        [New Catalog]  [Monolith]  [New Payment]
              │            │            │
              └────────────┴────────────┘
                    (routing по path/feature)
```

| Фаза | Действие |
|------|----------|
| 0 | Facade перед монолитом |
| 1 | Новые фичи — в новом сервисе |
| 2 | Миграция read-path (read из нового, write ещё в монолите) |
| 3 | Dual write / sync / events — осторожно |
| 4 | Отключение route в монолите |

---

## Seam (шов) — где резать

| Хороший шов | Плохой шов |
|-------------|------------|
| Мало входящих вызовов | 50 импортов из других модулей |
| Чёткий API модуля | shared ORM models везде |
| Отдельная таблица/схема уже есть | JOIN через 5 таблиц монолита |

Инструмент: **dependency graph** модулей ([django apps](../django/05-apps-structure.md)).

---

## Branch by abstraction

1. Ввести **интерфейс** `PaymentPort` в монолите
2. Реализация v1 — локальный модуль
3. Реализация v2 — HTTP к Payment svc
4. Feature flag переключает реализацию
5. Удалить v1

---

## Parallel run (verify)

```text
Запрос → Monolith (authoritative) + shadow call → New Service
Сравнение ответов в логах (без отдачи клиенту)
```

Только после N дней совпадений — переключить трафик.

---

## Data migration

| Стратегия | Описание |
|-----------|----------|
| **Bulk copy** | one-off ETL, downtime window |
| **CDC** | Debezium из монолита → новый store |
| **Event backfill** | история через доменные события |

Не выделяйте сервис без плана **источника правды** на переходный период.

---

## В mock-exams

| Тема | Курс |
|------|------|
| nginx routing | [nginx-basic/04](../nginx-basic/04-reverse-proxy.md) |
| Feature deploy | [gitlab-intermediate](../gitlab-intermediate/README.md) |
| API versioning | [api-design/07](../api-design/07-versioning-compatibility.md) |

---

## Подзадачи

**Время:** ~55–65 мин.

### 4.1 Выбор первого шва (15 мин)

Из context map (гл.02) выберите модуль для strangler #1. Таблица: входящие зависимости | исходящие | оценка 1–5 сложности.

### 4.2 Routing plan (15 мин)

Опишите правила facade: какие `path`/`Host`/`header` идут в монолит vs новый сервис. Пример для `/api/v1/catalog/*`.

### 4.3 Branch by abstraction (15 мин)

Назовите 1 интерфейс (port) в монолите и 2 реализации (local / remote). Кто переключает feature flag?

### 4.4 Parallel run (10 мин)

Что сравниваете (status code, body hash, latency)? Сколько дней shadow до cutover?

### 4.5 Rollback (10 мин)

Один сценарий: новый сервис падает — как за 5 мин вернуть 100% на монолит?

---

## Резюме

Миграция — **маршрутизация + данные + флаги**, не переписывание. Strangler минимизирует big bang; parallel run снижает страх.

---

## Чек-лист

- [ ] Facade/route описан?
- [ ] Rollback без деплоя монолита?
- [ ] Data source of truth на каждой фазе ясен?

**Дальше:** [05. Синхронная коммуникация](05-sync-communication.md).
