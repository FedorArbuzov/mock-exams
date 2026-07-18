# 03. SLI, SLO, SLA: измерение и договорённости

## Введение: «uptime 100%», а клиенты уходят

Дашборд зелёный: все node Ready, CPU < 50%, synthetic check `/health` — 200. Тем временем **1% checkout** падает с `timeout` из‑за медленного фрагмента цепочки; **поиск** отдаёт пустую выдачу для кириллицы после релиза; **мобильное приложение** не парсит новый формат JSON. Менеджмент говорит: «инфраструктура стабильна». Поддержка: «тикетов в 3 раза больше». 

Разрыв возникает, когда **индикатор инфраструктуры** подменяет **индикатор опыта пользователя**. SRE вводит три уровня договорённости: **SLI** (что измеряем), **SLO** (какой целевой уровень), **SLA** (что обещано контрактом). Эта глава — самая объёмная в части I: здесь закладывается язык, на котором строятся алерты, релизы и разговоры с бизнесом.

---

## Три уровня: SLI → SLO → SLA

| Термин | Полное имя | Кто живёт | Пример |
|--------|------------|-----------|--------|
| **SLI** | Service Level **Indicator** | SRE + dev | «Доля успешных HTTP POST /checkout за 5 мин» |
| **SLO** | Service Level **Objective** | Команда сервиса | «99,9% успешных checkout за 30 rolling days» |
| **SLA** | Service Level **Agreement** | Юристы + sales | «При нарушении SLO — кредит 10% счёта» |

**Правило:** инженеры ежедневно оперируют **SLI + SLO**. **SLA** — надстройка с **денежными** последствиями; SLA target обычно **строже** внутреннего SLO (буфер).

```text
  Пользователь
       │
       ▼
  ┌─────────┐     порог      ┌─────────┐     контракт    ┌─────────┐
  │   SLI   │ ─────────────► │   SLO   │ ──────────────► │   SLA   │
  │ (факты) │                │ (цель)  │   (опционально) │ (штраф) │
  └─────────┘                └─────────┘                 └─────────┘
```

---

## Хороший SLI: четыре свойства

1. **User-centric** — отражает путь пользователя, не внутреннюю метрику.
2. **Measurable** — автоматически из логов, метрик, синтетики, трасс.
3. **Aggregatable** — одно число на сервис/путь за окно.
4. **Actionable** — при деградации SLI команда знает, что делать.

### Плохие SLI

| Плохой SLI | Почему |
|------------|--------|
| CPU < 80% | не про пользователя |
| «Нет алертов» | circular |
| Disk free > 10% | симптом, не опыт |
| Mean latency без p99 | скрывает хвост |

### Хорошие SLI (примеры)

| Сервис | SLI | Источник |
|--------|-----|----------|
| HTTP API | availability = successful / total | ingress metrics, `http_requests_total` |
| API | latency p99 < 500 ms | histogram |
| Batch pipeline | freshness: % jobs completed < 1h late | scheduler metrics |
| Stream consumer | lag < N messages | Kafka exporter ([kafka-intermediate/17](../kafka-intermediate/17-monitoring.md)) |
| Data store | durability: % writes acknowledged | replication lag, ack policy |

---

## Availability: не только «не 500»

Классическая **availability** для request/response:

```text
Availability = (valid requests - bad requests) / valid requests
```

Что считать **bad**:

| Вариант | Включать | Спорные случаи |
|---------|----------|----------------|
| Строгий | 5xx, timeout | 429 rate limit — bad? |
| Продуктовый | только failed business outcome | 200 с `{"status":"error"}` |
| Synthetic | только probe | не видит реальных клиентов |

**Документируйте** в SLO doc: «5xx и `timeout` — bad; 4xx кроме 429 — не bad; 429 при abuse — не bad».

**Correctness SLI** (сложнее): доля заказов с расхождением суммы; доля ответов с невалидной схемой. Часто через **аудит**, **reconciliation job**, sampling.

---

## Latency SLI

Пользователь чувствует **хвост**, не среднее.

| Агрегат | Когда |
|---------|-------|
| p50 | «типично» |
| p95 / p99 | SLO для interactive API |
| p99.9 | платежи, поиск (осторожно — шум) |

**SLO формулировка:** «99% запросов **fast** за 30d», где **fast** = latency < 300 ms.

Prometheus (идея):

```promql
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
) < 0.3
```

Подробнее гистограммы — [observability-intermediate/11](../observability-intermediate/11-histograms-quantiles.md).

---

## Окна измерения

| Тип окна | Описание | Плюс | Минус |
|----------|----------|------|-------|
| **Rolling** 30d | последние 30×24 ч | сглаживает | сложнее объяснить бизнесу |
| **Calendar month** | 1–31 | отчётность | граница месяца «обнуляет» |
| **Rolling 7d** | неделя | быстрее feedback | шум |

SLO почти всегда: **«X% good events за окно Y»**.

Пример: **99,9% availability за rolling 30 days** → error budget ≈ **0,1%** bad events (см. [главу 04](04-error-budgets.md)).

---

## Сколько «девяток» выбирать

Не копировать «как у Google». Вопросы к продукту:

1. Что случится при **1 ч** простоя checkout в Black Friday?
2. Есть ли **конкурент** с лучшим UX?
3. Сколько стоит **инженерия** следующей девятки?

| SLO | Пример продукта |
|-----|-----------------|
| 99% | internal admin |
| 99,5% | B2B API non-critical |
| 99,9% | основной consumer API |
| 99,95% | checkout, auth |
| 99,99% | платёжный шлюз (дорого) |

**Два SLO на один сервис** — норма: availability **и** latency.

---

## Декомпозиция: user journey

Не один SLI на 200 микросервисов. **Critical user journey (CUJ)**:

```text
Browse → Add to cart → Checkout → Pay → Confirm email
```

Для каждого шага — **свой** SLI или общий end-to-end synthetic:

| Шаг | SLI |
|-----|-----|
| Checkout | success rate POST /checkout |
| Pay | success + p99 latency payment gateway |
| E2E | synthetic script every 1 min |

**End-to-end** ловит интеграции; **per-service** — локализация. Нужны **оба**.

---

## SLI implementation checklist

1. **Источник данных** — Prometheus, logs, OTel ([observability-intermediate/13](../observability-intermediate/13-otel-metrics.md)).
2. **Labels** — `method`, `route`, `status`, не high-cardinality `user_id`.
3. **Recording rules** — `slo:checkout_availability:ratio5m` ([observability-intermediate/01](../observability-intermediate/01-recording-rules.md)).
4. **Dashboard** — одна панель «остаток budget».
5. **Владелец** — имя команды в doc.

Пример recording (упрощённо):

```yaml
- record: slo:checkout_availability:ratio5m
  expr: |
    sum(rate(http_requests_total{route="/checkout",status=~"2.."}[5m]))
    /
    sum(rate(http_requests_total{route="/checkout"}[5m]))
```

---

## Multi-window burn (введение)

Алерт «SLO < 99,9% за месяц» сработает **поздно**. **Burn rate** — скорость расхода error budget. Google SRE Workbook предлагает **multi-window, multi-burn-rate** alerts: быстрое «сжигание» за 5 мин + подтверждение за 1 ч.

Интуиция:

| Burn | Значение |
|------|----------|
| 1× | тратим budget ровно по плану |
| 14× | за сутки сожжём месячный budget |
| 720× | за час — катастрофа |

Детали алертов — [глава 07](07-alerting-on-call.md), advanced [observability-advanced/11](../observability-advanced/11-system-design-observability.md).

---

## SLA vs SLO: буфер

Если SLA клиенту: **99,5%**, внутренний SLO часто **99,7%** — запас на инциденты без выплат. **Никогда** не обещайте в SLA то, что не измеряете SLI.

---

## Документ SLO (шаблон одной страницы)

```markdown
# SLO: Checkout API

## Owners
Team: payments-platform; Slack: #payments-sre

## User journey
User completes purchase with card.

## SLIs
1. Availability: non-5xx, non-timeout responses / all valid requests
2. Latency: proportion of requests < 400ms (histogram)

## SLO targets (rolling 30d)
- Availability: 99.95%
- Latency: 99% < 400ms

## Error budget policy
- Budget > 50%: normal releases
- 10–50%: canary only, extra review
- < 10%: freeze except hotfix
- Exhausted: incident review, no feature work until recovery plan

## Dashboards / alerts
- Grafana: ...
- Alerts: burn-rate ...

## Runbooks
- https://...
```

Финал курса — заполнить такой doc: [глава 16](16-synthesis-practice.md).

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| SLO на всё подряд | нет приоритетов, alert fatigue |
| SLI без исключений 4xx | ложный budget burn |
| Один глобальный SLO на 50 сервисов | никто не owner |
| SLO 100% | невозможно релизить |
| Нет записи в Git | расхождение версий doc |

---

## В mock-exams

| Материал | Курс |
|----------|------|
| Краткий SLO + lab | [observability-intermediate/07–08](../observability-intermediate/07-slo-sli-sla.md) |
| Примеры rules | [examples/slo-recording-rules.yml](../observability-intermediate/examples/slo-recording-rules.yml) |
| Mock interview SLO | [observability-advanced/10](../observability-advanced/10-lab-mock-interview.md) |

---

## Заметки для собеседования

- Разница SLI / SLO / SLA.
- Почему p99, не average?
- Как посчитать budget при 99,9% / 30d?
- Пример **bad** SLI и исправление.
- Что такое burn rate одной фразой?

---

## Резюме

SLI — **факты** о опыте пользователя. SLO — **цель**, согласованная с бизнесом. SLA — **контракт** с последствиями. Без SLI вы не управляете надёжностью — вы реагируете на шум.

---

## Чек-лист

- [ ] Напишите 2 SLI для одного CUJ.
- [ ] Обоснуйте target (не «взяли 99,9»).
- [ ] Определите bad для 4xx/429/timeout.
- [ ] Выберите окно rolling vs calendar.
- [ ] Набросайте черновик SLO doc.

**Дальше:** [04. Error budget](04-error-budgets.md).
