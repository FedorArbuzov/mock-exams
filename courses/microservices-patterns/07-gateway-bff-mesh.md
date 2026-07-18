# 07. API Gateway, BFF и service mesh (обзор)

## Введение

Клиент не должен знать про 40 внутренних host:port. **Gateway** — edge auth и routing; **BFF** — агрегация под UI; **mesh** — mTLS и traffic policy **между** сервисами.

---

## API Gateway (edge)

```text
Internet → [WAF] → [API GW] → internal services
```

| Функция | Пример |
|---------|--------|
| TLS termination | cert на GW |
| AuthN | JWT validate |
| Rate limit | per API key |
| Routing | path → service |
| Request transform | header injection |

AWS: [API Gateway](../aws-intermediate/05-api-gateway.md). On-prem/K8s: Kong, Envoy Gateway, nginx.

**Не** класть бизнес-логику в GW — только cross-cutting.

---

## BFF (Backend for Frontend)

| BFF | Зачем |
|-----|-------|
| Mobile BFF | меньше payload, один round-trip |
| Web BFF | другая агрегация |
| Partner BFF | стабильный внешний контракт |

```text
Mobile → Mobile BFF → [Catalog, Cart, Profile] (parallel)
```

BFF **владеет** агрегацией; не пробрасывает raw internal errors наружу.

Связь: [api-design/13](../api-design/13-boundaries-system-design.md).

---

## GraphQL на BFF (осторожно)

| + | − |
|---|---|
| один запрос — много полей | N+1, сложный кэш |
| гибкость для UI | overload backend |

Для публичного partner API чаще **стабильный REST/OpenAPI**.

---

## Service mesh (data plane)

```text
[Svc A + sidecar Envoy] ←mTLS→ [Svc B + sidecar]
         ↑                              ↑
    control plane (Istio/Linkerd)
```

| Возможность mesh | Без mesh |
|------------------|----------|
| mTLS по умолчанию | app-level TLS вручную |
| retries/timeouts policy | в коде библиотек |
| traffic split canary | отдельный deploy trick |

**Стоимость:** CPU sidecar, операционная сложность. Имеет смысл при **десятках** сервисов и зрелой platform-команде ([kuber-advanced](../kuber-advanced/README.md)).

---

## Слои не дублировать

| Плохо | Лучше |
|-------|-------|
| Rate limit на GW **и** на каждом svc **и** в mesh | политика: edge + critical internal |
| Auth в BFF **и** повторная в каждом svc | JWT validate на edge + scopes в svc |

---

## В mock-exams

| Тема | Курс |
|------|------|
| nginx reverse proxy | [nginx-basic](../nginx-basic/README.md) |
| Ingress K8s | [kuber-basic/20](../kuber-basic/20-ingress.md) |
| NetworkPolicy | [kuber-intermediate](../kuber-intermediate/README.md) |

---

## Подзадачи

**Время:** ~50–60 мин.

### 7.1 Edge diagram (15 мин)

Нарисуйте: Client → GW → (BFF?) → 3 сервиса. Подпишите TLS, auth, rate limit на слоях.

### 7.2 BFF aggregation (15 мин)

Экран «карточка товара»: какие 3–4 internal call? Parallel или serial? Sketch JSON ответа BFF.

### 7.3 GW vs BFF responsibilities (10 мин)

Таблица: функция | GW | BFF | Service (да/нет где).

### 7.4 Mesh decision (10 мин)

Для продукта из гл.01: mesh **да/нет/позже** — 5 аргументов.

### 7.5 Partner API (10 мин)

Внешний партнёр: отдельный BFF или прямой GW route? Обоснуйте versioning ([api-design/07](../api-design/07-versioning-compatibility.md)).

---

## Резюме

GW — **периметр**; BFF — **опыт клиента**; mesh — **внутренняя** безопасность и traffic. Не смешивайте доменную логику с инфраструктурными слоями.

---

## Чек-лист

- [ ] Бизнес-логика не в GW?
- [ ] BFF degradation policy есть?
- [ ] Mesh justified by scale?

**Дальше:** [08. Database per service](08-database-per-service.md).
