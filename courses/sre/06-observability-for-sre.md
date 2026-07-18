# 06. Наблюдаемость для SRE

## Введение: «у нас есть метрики, но мы слепы»

Prometheus собирает **тысячи** series; Grafana — **сотни** панелей; логи — **терабайты**. Инцидент: «медленно». Дежурный 40 минут листает графики. Оказывается, **один** downstream DB connection pool — а алертов на него не было, потому что «CPU нормальный». **Observability** для SRE — не «накопить данные», а **ответить на новые вопросы** за минуты: что сломалось, где, для кого, с какого релиза.

---

## Три столпа (и три типа сигналов)

| Столп | Вопрос | Инструмент (типично) |
|-------|--------|----------------------|
| **Metrics** | Сколько? Как быстро? | Prometheus, CloudWatch |
| **Logs** | Что случилось в этом запросе? | Loki, ELK, OpenSearch |
| **Traces** | Где время в цепочке? | Jaeger, Tempo, X-Ray |

**Observability** (в узком смысле) — способность **вывести** внутреннее состояние по **внешним** выходам. Monitoring — **заранее** известные пороги; observability — **неизвестные** вопросы.

Курсы: [observability-basic](../observability-basic/README.md) → [intermediate](../observability-intermediate/README.md) → [advanced](../observability-advanced/README.md).

---

## Симптом vs причина

| Тип алерта | Пример | Проблема |
|------------|--------|----------|
| Симптом (good) | checkout error rate ↑ | близко к пользователю |
| Причина (context) | Postgres connections 100% | помогает **диагностике** |
| Шум (bad) | CPU > 80% | не actionable |

**Правило:** page human на **симптом** + SLO burn; **ticket** на причину, если не срочно.

---

## RED, USE, «четыре золотых сигнала»

**RED** (сервис): Rate, Errors, Duration — [глава 02](02-reliability-and-risk.md).

**USE** (ресурс): Utilization, Saturation, Errors — для node, disk, DB pool.

**Latency, Traffic, Errors, Saturation** (Google) — близко к RED + saturation.

На инциденте: **RED пути** → drill down **USE** узкого места.

---

## Структурированные логи

```json
{"level":"error","msg":"checkout failed","trace_id":"abc","user_tier":"pro","error":"timeout","dependency":"payments"}
```

- **trace_id** — связь с trace ([observability-advanced](../observability-advanced/README.md) OTel).
- **Низкая cardinality** в labels метрик; **высокая детализация** в логах.

---

## Dashboards для SRE

| Dashboard | Аудитория |
|-----------|-----------|
| **Executive / SLO** | остаток budget, availability 30d |
| **Service golden signals** | on-call |
| **Infrastructure** | platform |
| **Release** | версия vs error rate (аннотации deploy) |

**Один** dashboard «всё обо всём» — toil для глаз.

---

## Cardinality и стоимость

Высокая cardinality (`user_id` в label) **убивает** Prometheus и бюджет. SRE согласует **allowlist labels** с dev. Advanced: [observability-advanced](../observability-advanced/README.md).

---

## Synthetic monitoring

Проба **извне** (Blackbox, canary):

| Плюс | Минус |
|------|-------|
| видит DNS, CDN, TLS | не все user journeys |
| до пользователей | ложные негативы при блокировке probe IP |

Дополняет, **не заменяет** real traffic SLI.

---

## Observability и весь жизненный цикл

| Фаза | Observability |
|------|----------------|
| Design | «какие SLI?» |
| Build | metrics в коде, trace propagation |
| Deploy | аннотация версии, compare error rate |
| Incident | dashboards + logs + traces |
| Postmortem | timeline из логов |

---

## В mock-exams

| Стенд | Курс |
|-------|------|
| `deploy/observability` | basic/intermediate labs |
| ServiceMonitor | [kuber-advanced/14](../kuber-advanced/14-observability.md) |
| Kafka lag | [kafka-intermediate/17](../kafka-intermediate/17-monitoring.md) |

---

## Путь расследования (playbook)

```text
1. Alert fires (symptom / burn)
2. Open SLO + RED dashboard — scope? (all users vs region)
3. Deploy annotation — correlate release?
4. USE of top dependency — saturated?
5. Logs with trace_id — error class?
6. Trace (if available) — slow span?
7. Mitigate — rollback / scale / flag
8. Scribe timeline for postmortem
```

Время на шаги 2–4 — **минуты**, не часы, при хорошей observability.

---

## Exemplars и correlation

Prometheus **exemplars** связывают histogram bucket с **trace_id** — jump из графика в Jaeger. Даже без exemplars: **один** `trace_id` в логе сокращает поиск с «1000 Pod» до «один запрос».

---

## Антипаттерны observability

| Антипаттерн | Почему больно |
|-------------|---------------|
| Alert on every panel | fatigue |
| Dashboard без SLO line | нет контекста budget |
| Логи без уровней | нельзя фильтровать |
| Metrics per user_id label | cardinality explosion |
| «Настроим после launch» | PRR fail |

---

## Заметки для собеседования

- Monitoring vs observability.
- RED для API, USE для node.
- Почему page на symptom?
- Как cardinality убивает TSDB?

---

## Чек-лист

- [ ] Есть ли SLI dashboard, не только infra?
- [ ] Алерты на симптом или CPU?
- [ ] trace_id в логах критичного пути?
- [ ] Кто owner cardinality policy?

**Дальше:** [07. Алертинг и on-call](07-alerting-on-call.md).
