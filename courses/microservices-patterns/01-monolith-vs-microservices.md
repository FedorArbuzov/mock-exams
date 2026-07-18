# 01. Монолит vs микросервисы: decision framework

## Введение

«Нам нужны микросервисы» — часто означает «хотим Netflix», не зная цены: **распределённые транзакции**, отладка по trace id, версионная матрица и ночные деплои пяти команд. Первая глава — **когда не дробить** и какие критерии решения зафиксировать в ADR.

---

## Определения

| | Modular monolith | Microservices |
|--|------------------|---------------|
| Deploy | один артефакт | N независимых сервисов |
| Процесс | обычно один (или несколько реплик одного app) | отдельный процесс/под на сервис |
| БД | одна или схемы в одном кластере | **database per service** (цель) |
| Граница | модули в коде | сеть |

**Distributed monolith** — много сервисов, но деплоятся вместе и делят БД; худший из миров ([17-anti-patterns](17-anti-patterns.md)).

---

## Когда монолит (или modular monolith) лучше

| Сигнал | Почему |
|--------|--------|
| Команда < 10–15 инженеров | overhead сети > выгода автономии |
| Продукт ищет PMF | скорость изменений в одном репо |
| Сильные ACID-транзакции везде | распределённые saga сложнее |
| Нет зрелого CI/K8s/observability | ops не потянет |
| Домен плохо понят | границы сервисов будут неверными |

**Modular monolith:** чёткие пакеты/apps внутри ([django/05](../django/05-apps-structure.md), [fastapi/08](../fastapi/08-project-structure.md)) + возможность выделить модуль позже.

---

## Когда микросервисы оправданы

| Сигнал | Почему |
|--------|--------|
| Независимые **cadence** релизов доменов | billing раз в месяц, catalog ежедневно |
| Разный **scale** (read/write) | catalog 100× traffic vs billing |
| Разные **стеки** оправданы | ML inference vs CRUD |
| Организация **stream-aligned** команд | [03-conway-teams](03-conway-teams.md) |
| Regulatory **blast radius** | изоляция PCI scope |

---

## Decision matrix (шаблон)

Оцените 1–5 (1 = плохо подходит, 5 = отлично):

| Критерий | Monolith | Microservices |
|----------|----------|---------------|
| Time to market сейчас | | |
| Независимый deploy доменов | | |
| Транзакционная целостность | | |
| Масштабирование по частям | | |
| Найм / онбординг | | |
| Observability maturity | | |

Сумма не решает автоматически — **веса** зависят от стадии продукта.

---

## Стоимость микросервисов (явно)

```text
+ Автономия команд, изоляция сбоев (при правильных границах)
− Сеть: latency, partial failure, versioning
− Data: eventual consistency, дублирование read models
− Ops: tracing, mesh/gateway, N CI pipelines
− Тестирование: contract + e2e дороже
```

---

## В mock-exams

| Тема | Курс |
|------|------|
| Монолит Django | [django](../django/README.md) |
| Тонкий API FastAPI | [fastapi](../fastapi/README.md) |
| Сравнение стеков | [django/01](../django/01-django-landscape.md) |
| Async fan-out | [python-async/34](../python-async/34-system-design-async.md) |

---

## Подзадачи

**Время:** ~45–60 мин.

### 1.1 Контекст продукта (10 мин)

Выберите: [image-platform](../aws-intermediate/projects/image-platform/), [fastapi/42](../fastapi/42-capstone.md) или свой продукт. Заполните:

| Поле | Значение |
|------|----------|
| MAU / заказов в день (порядок) | |
| Размер команды backend | |
| Сколько раз в неделю deploy | |
| Есть ли PCI/PII изоляция | |

### 1.2 Decision matrix (15 мин)

Заполните таблицу из раздела выше с **весами** (сумма весов = 100%). Посчитайте взвешенный score для monolith и microservices.

### 1.3 Аргументы «за» и «против» (15 мин)

Напишите по **3 bullet** для каждой стороны **конкретно для вашего продукта**, не из Wikipedia.

### 1.4 Рекомендация (10 мин)

Одна страница: **Modular monolith / Microservices / Подождать 6 мес** + 2 rejected alternatives.

### 1.5 Риски (10 мин)

Таблица: риск | вероятность | impact | mitigation (например «нет tracing → не дробить billing»).

---

## Резюме

Микросервисы — **организационный и ops-паттерн**, не способ «писать чище». Начинайте с modular monolith, если нет явного драйвера автономии или scale.

---

## Чек-лист

- [ ] Decision matrix заполнена с весами?
- [ ] Rejected alternative задокументирован?
- [ ] Учтена зрелость observability?

**Дальше:** [02. Bounded context и декомпозиция домена](02-bounded-context-ddd.md).
