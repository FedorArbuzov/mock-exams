# 07. SLO, SLI и SLA

## Три уровня договорённости

| Термин | Что это | Пример |
|--------|---------|--------|
| **SLI** (Indicator) | Измеримый сигнал качества | Доля успешных HTTP-запросов за окно |
| **SLO** (Objective) | Целевое значение SLI | 99.5% запросов успешны за 30 дней |
| **SLA** (Agreement) | Юрид/коммерческий договор с последствиями | Возврат 10% при нарушении SLO |

В операционной работе инженер живёт в паре **SLI + SLO**; SLA — для юристов и аккаунтов.

## Хороший SLI

Свойства:

- **Пользовательский** — отражает опыт клиента (availability, latency, correctness).
- **Измеримый** — из метрик, логов или синтетики.
- **Агрегируемый** — один число на сервис, не тысяча графиков.

Для demo-app на стенде:

| SLI | PromQL (идея) |
|-----|----------------|
| Availability | `2xx / all` по `demo_http_requests_total` |
| Latency | `histogram_quantile` по `demo_http_request_duration_seconds` |
| Error rate | `5xx / all` |

## SLO и окно

SLO почти всегда привязан к **окну**:

- **Rolling 30d** — «за последние 30 дней».
- **Calendar month** — отчётность бизнесу.

Пример: **SLO availability 99.9%** за 30 дней → допустимая доля ошибок:

```text
Error budget = 1 - SLO = 0.1% «плохих» событий
```

При 1M запросов/месяц — ~1000 «плохих» (упрощённо; точное определение зависит от того, что считать событием).

## Error budget

**Error budget** — сколько «плохого» поведения можно «потратить», не нарушив SLO.

| Состояние budget | Действие команды |
|------------------|------------------|
| Много осталось | Фичи, рискованные релизы |
| Быстро тает | Freeze релизов, фокус на надёжность |
| Исчерпан | Инцидент-режим, postmortem, пересмотр SLO |

Burn rate — скорость расхода budget. Алерт на **быстрое сгорание** (multi-window) ловит инцидент раньше, чем «упали ниже 99.9% за месяц».

## Recording rules для SLO

Длинные выражения выносим в recording (см. [01-recording-rules.md](01-recording-rules.md)):

```yaml
- record: slo:demo_availability:ratio5m
  expr: |
    sum(rate(demo_http_requests_total{status=~"2.."}[5m]))
    /
    sum(rate(demo_http_requests_total[5m]))
```

Готовый файл: [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml).

Алерт (упрощённо):

```yaml
- alert: DemoSLOFastBurn
  expr: slo:demo_availability:ratio5m < 0.99
  for: 5m
```

В production используют **multi-burn-rate** (Google SRE workbook) — в advanced.

## SLO и алерты

| Плохо | Лучше |
|-------|-------|
| Алерт «CPU > 80%» без связи с пользователем | Алерт на SLI / burn rate |
| 50 алертов на каждый pod | Агрегат на сервис + routing ([09-alertmanager-routing.md](09-alertmanager-routing.md)) |
| SLO 100% | Нереалистично; нет budget на релизы |

## Пример из Kafka

Для потоковой платформы SLI часто — **lag** и **consumer availability**, не CPU broker ([17-monitoring](../kafka-intermediate/17-monitoring.md)):

- SLI: «95% времени lag < 10k сообщений на группу `orders`».
- SLO: 99% за 7 дней.
- Метрика: `kafka_consumergroup_lag` (exporter), recording `slo:kafka_lag:max5m`.

## Документирование SLO

Минимальный doc (1 страница):

1. Сервис и пользователь.
2. SLI (формула + источник метрик).
3. Target и окно.
4. Error budget policy.
5. Runbook при burn.

## Чек-лист

- [ ] Различаете SLI, SLO, SLA.
- [ ] Считаете error budget из target (например 99.9%).
- [ ] Понимаете, зачем recording `slo:*` перед алертами.

**Дальше:** [08. Лаба: error budget](08-lab-error-budget.md).
