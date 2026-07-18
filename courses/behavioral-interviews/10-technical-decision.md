# 10. Техническое решение и trade-off

## Введение

Behavioral + tech: «Расскажите о сложном техническом решении». Проверяют **judgment**, не синтаксис. Идеально стыкуется с ADR и курсами mock-exams.

---

## Структура

```text
Problem  — боль, constraints (latency, team, budget)
Options  — 2–3 варианта (monolith split, Kafka vs SQS, sync vs async)
Decision — критерии, кто решал
Outcome  — метрики, surprises
Learning — что знаете теперь
```

Источники: [api-design](../api-design/README.md), [messaging-deep/14](../messaging-deep/14-synthesis.md), capstone.

---

## Примеры тем

| Тема | Trade-off |
|------|-----------|
| Outbox vs dual write | consistency vs complexity |
| Cursor vs offset pagination | UX vs DB load |
| Redis cache | staleness vs speed |
| K8s vs managed PaaS | ops vs cost |

---

## Подзадачи

**Время:** ~60 мин.

### 10.1 ADR в STAR (30 мин)

Одно решение из работы или capstone в SOAR.

### 10.2 Rejected option (15 мин)

Почему **не** выбрали популярный вариант (microservices day one, etc.).

### 10.3 2 мин pitch (15 мин)

Устно для нетехнического hiring manager.

---

## Чек-лист

- [ ] ≥2 options?
- [ ] Критерии явные?

**Дальше:** [11. Командная работа](11-teamwork-mentoring.md).
