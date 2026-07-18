# 03. DORA: четыре метрики и что они значат

## Введение

«У нас 200 деплоев в месяц» — CEO радуется. «90% из них — hotfix после предыдущего» — инженеры нет. **DORA** (ныне часть Google Cloud / Accelerate research) дала **четыре ключевые метрики**, связанные с **организационной** производительностью и стабильностью.

---

## Четыре ключевые метрики

| Метрика | Вопрос | Хороший тренд |
|---------|--------|---------------|
| **Deployment frequency** | как часто в prod? | чаще (для вашего контекста) |
| **Lead time for changes** | commit → prod? | короче |
| **Change failure rate** | % изменений → инцидент/hotfix? | ниже |
| **Time to restore** | MTTR после сбоя? | короче |

**Важно:** «Elite / High / Medium / Low» — **когорты** из исследований; сравнивайте **себя с собой** во времени, не с Netflix из доклада.

---

## Deployment frequency

| Контекст | «Хорошо» выглядит как |
|----------|----------------------|
| SaaS web | раз в день — раз в неделю |
| Regulated bank | раз в месяц **если** lead time и CFR при этом сильные |
| Mobile app store | train releases, но **внутренние** среды — часто |

Считать: **успешные** деплои в prod, не «запуски pipeline».

В mock-exams: частые merge в [gitlab-intermediate](../gitlab-intermediate/README.md) → mockctl.

---

## Lead time for changes

Разбивайте на сегменты:

```text
coding → review → CI → staging → approval → prod
```

Узкое место часто **не** «docker build», а **ожидание QA sign-off 5 дней**.

**Work in progress** убивает lead time сильнее, чем медленный тест.

---

## Change failure rate

```text
CFR = (деплои, вызвавшие сбой в prod) / (все деплои в prod)
```

Определите **«сбой»** заранее: Sev2+ инцидент? hotfix в 24h? rollback?

Высокий CFR при высокой frequency — **сигнал** качества тестов или архитектуры, не «слишком много деплоев».

---

## Time to restore (MTTR)

От **пользовательского impact** до **восстановления SLO**, не от «первого пинга в Slack».

Связь: [sre/07–09](../sre/07-alerting-on-call.md), [observability-basic](../observability-basic/README.md).

---

## Четыре метрики вместе

```text
         Быстро деплоим ──────────────────►
              │                    │
              │  Elite quadrant    │  «Движемся быстро
              │  (часто + надёжно)│   и ломаемся редко»
              ▼                    ▼
         Медленно ◄────────────────── Часто ломаемся
```

Оптимизация **одной** метрики в вакууме вредна: frequency ↑ без CFR ↓ — хаос.

---

## Резюме

DORA — **язык** между engineering и бизнесом. Без определений «деплой» и «сбой» цифры бессмысленны.

---

## Чек-лист

- [ ] Можете ли вы посчитать lead time за последний MR?
- [ ] Что у вас считается change failure?
- [ ] MTTR считается от impact или от тикета?

**Дальше:** [04. DORA capabilities](04-dora-capabilities.md).
