# 06. Reverse Conway: проектировать команды под систему

## Введение

**Reverse Conway maneuver** (Team Topologies): если нужна **целевая архитектура** — сначала (или параллельно) **меняют** границы команд и каналы связи, иначе система **откатится** к старой форме.

---

## Алгоритм (практический)

1. **Нарисовать** целевую архитектуру (bounded contexts, deploy units).
2. **Назначить** stream-aligned team на каждый context.
3. **Выделить** platform для общего (K8s, CI, observability).
4. **Сократить** cross-team зависимости в релизе до **контрактов** (API, events).
5. **Измерить** DORA по squad ([глава 03](03-dora-metrics.md)).

---

## Пример: ecommerce

**Цель:** checkout независим от catalog.

| Шаг | Действие |
|-----|----------|
| 1 | Команда Checkout владеет checkout-api + checkout-db |
| 2 | Catalog — отдельная команда, read API для checkout |
| 3 | Platform — EKS, GitLab, Prometheus |
| 4 | Enabling — временно помогает checkout внедрить tracing |

**Не** делать: 20 микросервисов, **одна** команда 8 человек.

---

## Strangler и org change

Миграция monolith → services **вместе** с разделением команд:

```text
Monolith squad
    → split team A (payments) + team B (catalog)
    → extract payment service (код следует за командой)
```

Технический strangler без org split — **вечный** «shared core».

---

## Риски reverse Conway

| Риск | Митигация |
|------|-----------|
| Турф wars | явные mission statements |
| Дублирование platform | один IDP |
| Недогрузка людей | enabling, не layoff panic |
| Big bang reorg | эволюция по доменам |

---

## Связь с SRE org

[sre/13](../sre/13-organizing-sre.md): centralized SRE на **platform layer**, embedded SRE в **critical** streams — пример reverse Conway для **надёжности**.

---

## Резюме

Сначала **кто владеет чем**, потом **границы в коде**. Архитектура «на бумаге» без reorg — wishful thinking.

---

## Чек-лист

- [ ] Есть ли bounded context, которым никто не владеет?
- [ ] Platform обслуживает squads или конкурирует с ними?
- [ ] Один релиз требует сколько команд?

**Дальше:** [07. Team Topologies: типы команд](07-team-topologies-types.md).
