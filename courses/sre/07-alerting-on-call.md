# 07. Алертинг и on-call

## Введение: «нас разбудили, а делать нечего»

03:14, PagerDuty: **Critical: CPU > 90%**. Дежурный просыпается, смотрит — batch job ночью, **ожидаемо**. В 09:00 — **Critical: checkout errors**, но алерт пришёл **после** 20 мин простоя: порог «>1% errors за 15 min». К обеду дежурный **устал игнорировать** CPU — и пропустил настоящий. SRE строит алертинг как **продукт**: каждый page стоит денег (сон, репутация, burnout).

---

## Принципы алертинга

1. **Page только если нужно действие сейчас** (wake up).
2. **Симптом / SLO**, не причина без контекста.
3. **Каждый alert** имеет runbook link.
4. **Тестируйте** alert (alertmanager test, game day).
5. **Регулярно чистите** (quarterly alert review).

| Уровень | Канал | Пример |
|---------|-------|--------|
| Page | PagerDuty, звонок | SLO fast burn, checkout down |
| Ticket | Jira, Slack next day | disk 70% |
| Log | dashboard only | dev staging noise |

---

## On-call модель

| Модель | Описание |
|--------|----------|
| **Follow-the-sun** | handoff по часовым поясам |
| **Primary + secondary** | backup если primary не ответил |
| **Embedded** | dev команды дежурят по своему сервису |
| **Central SRE** | платформа + эскалация |

**Обязательно:**

- **Runbook** и **эскалация** (кого звать через 15 min).
- **Компенсация** (отгул, оплата) — культура зависит от компании.
- **Blameless** — дежурный не виноват в инциденте.
- **Лимит** недель/год на человека.

---

## Alert fatigue

Причины:

- дублирующие алерты (CPU + Memory + Pod restart на одно);
- flaky (само проходит);
- «известный шум» без исправления.

**Лечение:** объединение, `for: 5m`, inhibition в Alertmanager ([observability-intermediate/09](../observability-intermediate/09-alertmanager-routing.md)), **удаление** бесполезных.

---

## SLO-based alerting

| Подход | Когда |
|--------|-------|
| Static threshold | ресурс с жёстким потолком (disk 95%) |
| Burn rate | user-facing SLO ([глава 04](04-error-budgets.md)) |
| Anomaly detection | сезонный трафик (осторожно) |

Пример policy (концепт):

- **Page** если burn > 14× за 1h **и** > 6× за 6h (multi-window).
- **Ticket** если budget < 25% за 30d.

---

## Эскалация и коммуникация

```text
L1 on-call (15 min) → L2 service owner → L3 platform → executive (P0 only)
```

**Status page** / support — роль **comms**, не IC ([глава 08](08-incident-management.md)).

---

## Инструменты

| Функция | Примеры |
|---------|---------|
| Routing | Alertmanager, PagerDuty, Opsgenie |
| Schedules | PagerDuty rotations |
| Incident channel | Slack `#inc-YYYYMMDD-checkout` |

---

## After-action для алертов

После каждого ложного page:

- **Tune** или **delete** alert?
- Нужен ли **runbook** update?

---

## On-call здоровье и устойчивость

| Практика | Зачем |
|----------|-------|
| Max 1 week primary / month | сон |
| Handoff document | контекст при смене |
| «No deploy» для on-call day after | recovery |
| Post-incident debrief для дежурного | не только для системы |

**Burnout** on-call — риск **пропустить** реальный P0.

---

## Runbook минимум

```markdown
# Alert: CheckoutHighErrorRate

## Impact
Users cannot complete purchase.

## First steps (5 min)
1. Check SLO dashboard: ...
2. Recent deploys: ...
3. If deploy < 30m ago → rollback: ...

## Escalate
@payments-oncall → @platform after 15m
```

Без runbook алерт — **паника**; с runbook — **чеклист**.

---

## Пример burn-rate policy (словами)

При SLO 99,9% / 30d:

- **Page** если за 1h тратим budget как за 24h **и** за 6h как за 3d.
- **Ticket** если остаток budget < 25%.
- **Freeze** если < 10% ([глава 04](04-error-budgets.md)).

Реализация: Prometheus + Alertmanager или SaaS SLO tools.

---

## Заметки для собеседования

- Page vs ticket vs log?
- Как бороться с alert fatigue?
- Follow-the-sun vs single team?
- Зачем secondary on-call?

---

## Чек-лист

- [ ] Сколько alerts за неделю **потребовали** действия?
- [ ] Есть ли runbook URL в каждом critical?
- [ ] Primary/secondary определены?
- [ ] SLO burn alerts настроены?

**Дальше:** [08. Инцидент-менеджмент](08-incident-management.md).
