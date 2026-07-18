# 10. Лаба: mock interview — 45 минут

## Цель

Симуляция technical interview: **15 мин** rapid-fire, **20 мин** system design lite, **10 мин** ваши вопросы интервьюеру.

## Предварительно

- [09-interview-qa](09-interview-qa.md) и [interview-cheatsheet](interview-cheatsheet.md) — прочитаны **до** сессии.
- Белая доска / бумага.

---

## Раунд 1 — Rapid fire (15 мин)

10 вопросов, **30 секунд** на ответ вслух:

1. Три столпа observability?
2. Чем trace отличается от лога?
3. Что такое cardinality?
4. RED vs USE?
5. Зачем kube-state-metrics?
6. ServiceMonitor — зачем?
7. Зачем OTel Collector?
8. Head sampling vs tail sampling?
9. `rate()` для чего?
10. Почему `user_id` не в labels?

**Оценка:** ≥7/10 без шпаргалки — pass.

---

## Раунд 2 — System design lite (20 мин)

**Промпт:** «E-commerce API, 200 микросервисов, 80k RPS peak, multi-AZ AWS + EKS. Нужны SLO 99.95%, on-call < 15 мин MTTA».

Нарисуйте:

- где metrics/logs/traces собираются;
- OTel deployment (agent/collector);
- 3 SLI и SLO;
- cardinality policy (1 пример запрета);
- alert routing (Alertmanager vs CloudWatch);
- Redis cache layer — какие **2** сигнала ([redis-intermediate/15](../redis-intermediate/15-monitoring.md));
- retention и cost knob.

**Rubric:**

| 0 | 1 | 2 |
|---|---|---|
| Один Prometheus на всё без HA | HA Prometheus / AMP | + federation/tenant |
| Нет sampling | «1% head» | + tail errors |
| Logs без trace_id | Упомянул correlation | + standard schema |
| 50 alerts на всё | SLO burn | Actionable + runbook |

≥6/8 — pass. Эталон: [12-lab-system-design](12-lab-system-design.md).

---

## Раунд 3 — Ваши вопросы (10 мин)

Подготовьте 3 вопроса компании:

1. Какой backend traces (Jaeger/Tempo/X-Ray)?
2. Кто владеет cardinality guidelines?
3. Как устроен on-call (rotation, game days)?

---

## После сессии

- [ ] Записали слабые темы → повторить главы 01, 05, 07, 11
- [ ] Обновили cheatsheet своими формулировками

Следующий урок: [11-system-design-observability.md](11-system-design-observability.md).
