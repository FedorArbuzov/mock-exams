# 16. Синтез: практика, собеседования, чек-лист

## Зачем финальная глава

Шестнадцать глав — много концептов. Эта глава **собирает** их в **один рабочий артефакт** и даёт ориентиры для **интервью** и **самооценки** зрелости. Без практики на **вашем** (или учебном) сервисе теория остаётся абстракцией.

---

## Практическое задание: SLO-документ

Выберите сервис:

- реальный на работе (без секретов в публичном fork), или  
- учебный: checkout из [aws-intermediate image-platform](../aws-intermediate/projects/image-platform/), demo-app из [deploy/observability](../../deploy/observability/README.md), hello-gitops из [deploy/gitops](../../deploy/gitops/README.md).

### Deliverables (2–4 часа)

1. **One-page SLO doc** ([шаблон из главы 03](03-sli-slo-sla.md)):
   - owners, CUJ, 2 SLI, targets 30d, определение bad events.
2. **Error budget policy** ([глава 04](04-error-budgets.md)) — таблица freeze thresholds.
3. **Один burn-rate alert** (описание словами или YAML из [observability-intermediate](../observability-intermediate/07-slo-sli-sla.md)).
4. **Postmortem outline** для tabletop P0 ([глава 09](09-postmortems.md)) — timeline из 6 строк + 3 actions.
5. **PRR**: 10 пунктов checklist — отметьте ✅/❌ для выбранного сервиса ([глава 14](14-production-readiness.md)).

### Критерии самопроверки

| # | Критерий |
|---|----------|
| 1 | SLI user-centric, не CPU |
| 2 | SLO обоснован (не скопирован 99,9) |
| 3 | Policy согласуема с PM «на бумаге» |
| 4 | Postmortem blameless |
| 5 | Есть связь с курсом mock-exams для практики метрик |

---

## Карта курса (повторение)

```text
01–04  Измерение и budget     →  «сколько можно ломать»
05     Toil                   →  «время на инженерию»
06–07  Observe + alert        →  «как узнать и разбудить»
08–09  Incident + learn       →  «как реагировать и учиться»
10–12  Capacity, change, DR   →  «как не умереть от роста и катастрофы»
13–15  Org, launch, money      →  «как встроить в бизнес»
16     Синтез                 →  «ваш SLO doc»
```

---

## Вопросы с собеседований (развёрнутые ответы)

### 1. Чем SRE отличается от DevOps?

**Коротко:** DevOps — культура и доставка; SRE — **практика с SLO/error budget**.  
**Развёрнуто:** DevOps не задаёт численный trade-off; SRE **измеряет** ненадёжность и **политикой** замедляет релизы при исчерпании budget. Можно быть DevOps без SRE; SRE без автоматизации — боль.

### 2. Как выбрать SLO 99,9 vs 99,95?

Смотрите **user pain**, **cost of downtime**, **cost of next nine**. Если разница не ощущается пользователем — 99,95 **дорога** зря. Документируйте допущения.

### 3. Error budget исчерпан — что делаете?

Freeze feature, reliability sprint, postmortem actions в приоритете, executive visibility. **Не** «тихо повышаем SLO».

### 4. Опишите инцидент, где вы были IC

Структура STAR: Situation, Task (роли), Action (mitigate first), Result (MTTR, postmortem). Если не были IC — tabletop.

### 5. Пример хорошего и плохого SLI

Плохой: CPU. Хороший: доля успешных checkout за 5m. Почему — [глава 03](03-sli-slo-sla.md).

### 6. Burn rate

Скорость расхода budget относительно «ровно на границе SLO». Алертим рано — [глава 04](04-error-budgets.md), [07](07-alerting-on-call.md).

### 7. Blameless postmortem

Не «без ответственности», а **системные** actions вместо наказания. Пример языка — [глава 09](09-postmortems.md).

### 8. RTO vs RPO

RPO — данные; RTO — время восстановления сервиса — [глава 12](12-disaster-recovery.md).

---

## Чек-лист зрелости SRE (личный)

| Практика | Да/Нет |
|----------|--------|
| Есть SLO на главный CUJ | |
| Burn alerts | |
| Postmortem < 72h для P0/P1 | |
| On-call runbook | |
| Load test перед пиком | |
| GitOps / controlled change | |
| DR drill < 12 мес | |
| Toil отслеживается | |

**8/8** — редкость; **4+** — здоровое направление.

---

## Куда идти после курса

| Цель | Курс mock-exams |
|------|-----------------|
| Метрики hands-on | [observability-intermediate](../observability-intermediate/README.md) |
| K8s production | [kuber-advanced](../kuber-advanced/README.md) |
| GitOps | [gitops-intermediate](../gitops-intermediate/README.md) |
| Security | [secrets-advanced](../secrets-advanced/README.md) |
| Mock CKA/CKS | [mock-ckad](../mock-ckad/README.md) |

---

## Резюме всего курса

SRE — **управление надёжностью как инженерией**: измерить (SLI/SLO), договориться (budget), узнать (observability), отреагировать (incident), учиться (postmortem), предотвратить (capacity, change, DR), встроить в организацию и **экономику**. Вы не обязаны помнить все таблицы — обязаны уметь **написать SLO doc** и **вести** разговор с продуктом на его языке.

---

## Завершение

Сохраните SLO doc в репозитории команды (или в личном конспекте). Перечитайте через **квартал** — живой документ или мёртвый шаблон?

**Курс завершён.** Вопросы и улучшения — через issues репозитория mock-exams.
