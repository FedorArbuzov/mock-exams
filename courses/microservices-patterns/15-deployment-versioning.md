# 15. Независимый deploy, версии и feature flags

## Введение

Главное обещание микросервисов — **деплоить Order без Catalog**. На практике shared library v1.2 ломает всех — **pseudo-independence**. Нужны версии контрактов, совместимость и feature flags.

---

## Independent deploy checklist

| Требование | Проверка |
|------------|----------|
| Отдельный CI pipeline | merge в order-repo → deploy только order |
| Отдельная БД | нет shared migration |
| Backward compatible API/events | consumer старой версии живёт |
| Contract tests green | [16-testing-strategy](16-testing-strategy.md) |

---

## Semantic versioning сервиса

| Изменение | Версия |
|-----------|--------|
| Bugfix compatible | patch |
| Новый optional endpoint/event field | minor |
| Breaking API/event | **major** + parallel run |

Версия **артефакта** ≠ версия **HTTP API** ([api-design/07](../api-design/07-versioning-compatibility.md)).

---

## Consumer-driven compatibility

```text
Payment v2 выкатили
Order (consumer v1) ещё 2 недели на старом contract
→ Payment v1 и v2 parallel OR Order dual consume
```

**Tolerant reader:** игнорировать unknown JSON fields.

---

## Feature flags

| Флаг | Уровень |
|------|---------|
| `use_new_inventory_svc` | routing в facade |
| `enable_bnpl` | бизнес в Order |

Хранилище: LaunchDarkly, Unleash, или DB + cache.

**Не** флаг вместо API version для breaking schema.

---

## Canary / blue-green per service

```text
10% traffic → Order v2.3
metrics OK → 100%
```

K8s: [kuber-intermediate HPA](../kuber-intermediate/README.md), Argo Rollouts — [gitops-intermediate](../gitops-intermediate/README.md).

---

## Shared libraries trap

| Плохо | Лучше |
|-------|-------|
| `common-models.jar` с доменом | copy DTO + contract test |
| Shared DB migration tool | per-repo Alembic/Flyway |

Минимизируйте **shared code**; дублирование схемы дешевле coupled deploy.

---

## В mock-exams

| Тема | Курс |
|------|------|
| GitLab deploy | [gitlab-intermediate](../gitlab-intermediate/README.md) |
| GitOps | [gitops-basic](../gitops-basic/README.md) |
| API versioning | [api-design/07](../api-design/07-versioning-compatibility.md) |

---

## Подзадачи

**Время:** ~55–65 мин.

### 15.1 Deploy matrix (15 мин)

Таблица: сервис | own repo? | own CI? | shared deps | truly independent? (Y/N)

### 15.2 Breaking change rollout (20 мин)

План: rename поля `total` → `amount_cents` между Payment и Order (4 шага, 2 недели).

### 15.3 Feature flag spec (10 мин)

Флаг strangler route: имя, default, кто может toggle, rollback.

### 15.4 Canary metrics (10 мин)

3 метрики go/no-go для canary Order svc.

### 15.5 Shared lib audit (10 мин)

Список shared пакетов в монолите — что вынести/убить при split.

---

## Резюме

Независимый deploy = **совместимые контракты** + изоляция данных + CI. Feature flags — для поведения, versioning — для schema.

---

## Чек-лист

- [ ] Breaking change имеет parallel period?
- [ ] Нет скрытого shared DB migration?
- [ ] Canary metrics определены?

**Дальше:** [16. Стратегия тестирования](16-testing-strategy.md).
