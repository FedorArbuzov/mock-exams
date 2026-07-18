# 09. Postmortem без обвинений

## Введение: «кто нажал кнопку»

Инцидент закрыт в 17:00. На следующий день в чате: «**кто** выкатил без review». Разработчик замолкает; тимлид защищает; SRE пишет длинный PDF, который **никто не читает**. Через месяц **тот же** outage — миграция БД без backup test.

**Blameless postmortem** — не «все молодцы», а **фокус на системе**: какие **условия** позволили ошибке дойти до пользователя и как **изменить** процесс/архитектуру/инструменты, чтобы класс повторился с меньшей вероятностью.

---

## Цели postmortem

| Цель | Не цель |
|------|---------|
| Понять **timeline** и contributing factors | найти виновного |
| **Action items** с owner и сроком | 40 страниц ради отчёта |
| Поделиться уроком с компанией | скрыть от клиента правду |
| Улучшить **следующий** инцидент | наказание |

---

## Когда писать

| Правило (пример) | |
|------------------|---|
| Все **P0/P1** | обязательно |
| P2 с необычным ущербом | да |
| Повтор за 30 дней | обязательно + escalation |
| «Мелочь» без user impact | optional short note |

**Срок:** черновик за **48–72 ч**, пока свежи факты; review на weekly reliability meeting.

---

## Структура документа

```markdown
# Postmortem: Checkout failures 2026-05-18

## Metadata
- Severity: P0
- Duration: 14:02–14:47 UTC (45 min)
- Authors: @scribe, @IC
- Status: Draft | Final

## Summary (2–3 предложения)
Что случилось для пользователя.

## Impact
- % failed checkouts, регионы, примерный revenue at risk
- Error budget consumed: ~12% monthly

## Timeline (UTC)
| Time | Event |
|------|-------|
| 14:02 | Alert: checkout error rate > 5% |
| 14:05 | IC assigned, channel opened |
| ... | |

## Root cause (technical)
Кратко: connection pool exhaustion after deploy X.

## Contributing factors
- Нет canary на dependency Y
- Load test не покрывал peak
- Runbook устарел

## What went well
- Rollback за 12 min
- Comms каждые 15 min

## What went wrong
- MTTD 8 min (алерт запоздал)
- Два параллельных rollback

## Action items
| ID | Action | Owner | Priority | Due |
|----|--------|-------|----------|-----|
| 1 | Add pool metric + alert | @team-db | P1 | 2026-06-01 |
| 2 | Canary on deploy path | @team-pay | P1 | 2026-06-15 |

## Lessons learned
Один абзац для широкой аудитории.
```

---

## Root cause vs contributing factors

| | Root cause | Contributing factor |
|---|------------|---------------------|
| Суть | **непосредственный** технический механизм | условие, **усилившее** |
| Пример | pool max=10 при RPS×2 | нет HPA, нет review миграции |

Один incident — **несколько** contributing factors; «единственная причина» часто **упрощение**.

**Five whys** — полезны, если не превращать в допрос:

1. Почему 503? — pool exhausted  
2. Почему exhausted? — новый код держит connections дольше  
3. Почему не заметили? — нет метрики active connections  
4. Почему нет метрики? — не в checklist PRR  
5. Почему не в PRR? — …

---

## Blameless язы

| Blaming | Blameless |
|---------|-----------|
| «Иван выкатил» | «Deploy 4.2.1 прошёл pipeline без canary gate» |
| «Они не прочитали doc» | «Runbook не был linked из alert» |
| «Человеческая ошибка» | «Система позволила необратимое действие без dry-run» |

**Human error** — не термин для закрытия расследования.

---

## Action items: качество

Хороший action:

- **Измеримый** — «alert на pool > 80%»  
- **С owner** — конкретный team/person  
- **С датой** — иначе ∞ backlog  
- **Приоритизирован** — P0 actions до feature freeze  

Плохой: «быть внимательнее», «улучшить коммуникацию» без процесса.

**Связь с Jira:** label `reliability`, отслеживание на review.

---

## Review meeting

30–60 мин, участники: IC, tech, PM, опционально support.

1. Scribe walkthrough timeline (5 min).  
2. Уточнения (10 min).  
3. Action items — owner **подтверждает** в зале (10 min).  
4. «Что узнала компания» (5 min).

**Запись** — для тех, кто не был в инциденте; **не** для публичного shame.

---

## Публикация и безопасность

| Аудитория | Содержание |
|-----------|------------|
| Engineering (wide) | полный doc |
| Leadership | summary + budget impact |
| Клиенты | status page language, без внутренних имён |

Секреты, 0-day, PII — **redact**. Утечка credentials в postmortem — **rotate**, не копировать в doc.

---

## Культура: когда postmortem «не работает»

| Симптом | Лечение |
|---------|---------|
| Actions never close | reliability sprint, WIP limit |
| Copy-paste от прошлого | шаблон + обязательные уникальные timeline |
| Fear | leadership участвует blameless |
| Только SRE пишет | dev on-call пишет черновик |

---

## Связь с error budget

Postmortem при **большом burn** — вход в **policy freeze** ([глава 04](04-error-budgets.md)). Leadership хочет видеть: **что изменится**, чтобы не сжечь оставшийся budget.

---

## В mock-exams

Напишите postmortem для tabletop из [главы 08](08-incident-management.md) — минимум timeline + 3 action items.

Runbook culture: [observability-advanced](../observability-advanced/README.md).

---

## Заметки для собеседования

- Blameless — что это **не** значит?
- Отличие mitigate от root cause в postmortem.
- Пример хорошего vs плохого action item.
- Зачем timeline в UTC?

---

## Резюме

Postmortem — **инвестиция** в снижение частоты и длительности будущих инцидентов. Без actions это **архив жалоб**; с actions и review — **механизм** эволюции системы.

---

## Чек-лист

- [ ] Шаблон postmortem в wiki/Git?
- [ ] Последний P0 — есть doc < 72h?
- [ ] ≥1 action closed за последний квартал из postmortem?
- [ ] Язык doc blameless?

**Дальше:** [10. Ёмкость, производительность, стоимость](10-capacity-performance.md).
