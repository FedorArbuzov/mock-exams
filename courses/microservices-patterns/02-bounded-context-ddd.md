# 02. Bounded context и декомпозиция домена

## Введение

«Сервис User» с полями из CRM, биллинга и логистики — **не сервис**, а shared kernel без границ. **Bounded context** (DDD) — язык и модель, внутри которых термины однозначны; граница сервиса должна следовать за контекстом, а не за таблицами БД.

---

## Ubiquitous language

| В контексте «Заказ» | В контексте «Доставка» |
|---------------------|------------------------|
| Order = корзина + оплата | Shipment = посылка на складе |
| status `paid` | status `in_transit` |

Один термин — **разные модели** в разных контекстах. Это нормально; опасно — **одна таблица** на всех.

---

## Context map (типы связей)

```text
[Sales] ──customer/supplier──► [Billing]
[Catalog] ──conformist──► [Search]   (Search копирует модель Catalog)
[Orders] ──anti-corruption layer──► [Legacy ERP]
```

| Связь | Смысл |
|-------|-------|
| **Partnership** | две команды, общий контракт |
| **Customer-Supplier** | upstream задаёт API downstream |
| **Conformist** | downstream принимает модель upstream |
| **Anti-Corruption Layer (ACL)** | перевод чужой модели в свою |
| **Shared kernel** | общий код/схема (минимизировать) |

---

## Как найти границы

| Эвристика | Вопрос |
|-----------|--------|
| Изменения вместе | Что меняется в одном PR чаще всего? |
| Разные SLA | Что требует 99.99% vs 99%? |
| Разные эксперты | Кто владеет знаниями домена? |
| Write vs read | Где экстремальный read? (→ CQRS позже) |

**Не** резать по техническим слоям: `UserService`, `NotificationService` без домена — **анемичная** декомпозиция.

---

## Пример: e-commerce

```text
Contexts:
  Catalog     — SKU, цена, наличие (read-heavy)
  Cart        — сессия, промо (short-lived)
  Order       — жизненный цикл заказа
  Payment     — авторизация, capture, refund
  Fulfillment — склад, отгрузка
  Notification— email/push (supporting)
```

Сервис **Notification** — supporting; не владеет «заказом».

---

## ACL на границе

```text
Legacy ERP JSON  →  [ACL mapper]  →  OrderCreated (внутреннее событие)
```

Без ACL доменная модель **заражается** полями ERP.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Django apps как bounded context | [django/05](../django/05-apps-structure.md) |
| Слои FastAPI | [fastapi/08](../fastapi/08-project-structure.md) |
| Домен в capstone | [fastapi/42](../fastapi/42-capstone.md) |

---

## Подзадачи

**Время:** ~50–60 мин.

### 2.1 Event storming (lite) (20 мин)

Для выбранного продукта выпишите **15–20 доменных событий** в прошедшем времени: `OrderPlaced`, `PaymentFailed`, …

Сгруппируйте события в **4–6 кластеров** — кандидаты в bounded contexts.

### 2.2 Context map (15 мин)

Нарисуйте 4+ контекста и подпишите связи (customer-supplier, ACL, …). Mermaid или ASCII.

### 2.3 Словарь терминов (10 мин)

Для двух контекстов опишите **одно слово с двумя значениями** (как «Order» выше).

### 2.4 Граница сервиса (10 мин)

Выберите **один** контекст для выделения первым. Обоснуйте: низкая связность, высокая частота изменений, или scale.

### 2.5 ACL (5 мин)

Если есть legacy/inтеграция — опишите, что делает ACL (вход/выход, без кода).

---

## Резюме

Сервис = **граница смысла**, не граница таблицы. Context map и ACL дешевле, чем переделывать «общую БД users».

---

## Чек-лист

- [ ] Event storming дал 4+ кластера?
- [ ] Нет сервиса «Utils»?
- [ ] ACL указан для legacy?

**Дальше:** [03. Конвей и топология команд](03-conway-teams.md).
