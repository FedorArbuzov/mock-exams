# 09. Alertmanager: маршрутизация и подавление шума

## Зачем отдельный Alertmanager

Prometheus **оценивает** правила и генерирует алерты; **Alertmanager** принимает их, **дедуплицирует**, **группирует**, **маршрутизирует** в receivers (email, Slack, PagerDuty, webhook) и применяет **inhibit rules**.

Без AM при тысяче pod вы получите тысячу писем. С AM — одно уведомление «сервис demo degraded» с вложенным списком.

На стенде: Prometheus → `alertmanager:9093`, конфиг `deploy/observability/config/alertmanager.yml`.

## Жизненный цикл алерта

```text
Pending (for: не прошло) → Firing → (resolve) → Resolved
```

- `for: 2m` в rule — алерт ** firing** только если условие держится 2 минуты.
- `resolve_timeout` в AM — как долго ждать перед «закрытием» группы после исчезновения сигнала.

## route: дерево маршрутов

Корневой `route` задаёт defaults:

```yaml
route:
  receiver: default
  group_by: ["alertname", "severity"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: critical
```

| Параметр | Смысл |
|----------|--------|
| `group_by` | Ключи группировки — одно письмо на группу |
| `group_wait` | Подождать, собрать похожие алерты |
| `group_interval` | Пауза между уведомлениями той же группы |
| `repeat_interval` | Повтор, если не resolved |
| `match` / `match_re` | Фильтр по labels |

Вложенные `routes` — более специфичные правила **выше** в дереве (первое совпадение).

## receivers

На учебном стенде receivers **пустые** (алерты видны только в UI AM). В production:

```yaml
receivers:
  - name: slack-ops
    slack_configs:
      - channel: "#alerts"
        send_resolved: true
```

Для лабы [10-lab-routing.md](10-lab-routing.md) добавим **webhook** в `webhook.site` или локальный `curl` listener.

## inhibit_rules

Подавление «шумного дочернего» при «главном» алерте:

```yaml
inhibit_rules:
  - source_match:
      severity: critical
    target_match:
      severity: warning
    equal: ["alertname"]
```

Если **critical** `DemoTargetDown` firing, **warning** с тем же `alertname` не шлётся отдельно (упрощённый пример на стенде).

Реальные сценарии:

- critical «кластер недоступен» inhibits все warning по подам;
- `equal: ["cluster", "namespace"]` — область подавления.

## grouping: практический пример

Три pod падают → три series `up==0`. С `group_by: [alertname]` → **одно** уведомление «DemoTargetDown» с тремя экземплярами в теле.

## Labels и annotations

Правило Prometheus:

```yaml
labels:
  severity: critical
  team: platform
annotations:
  summary: "..."
  runbook_url: "https://..."
```

AM маршрутизирует по **labels**; humans читают **annotations**.

## Связь с SLO

Алерты на burn rate — `severity: critical`, отдельный receiver `pager`. Информационные «budget 50% осталось» — `warning` → Slack.

## Существующие алерты стенда

`config/rules/demo-alerts.yml`:

- `DemoHighErrorRate` — warning, >5% 5xx;
- `DemoTargetDown` — critical, `up==0`.

## Чек-лист

- [ ] Объяснили `group_wait` vs `repeat_interval`.
- [ ] Знаете, как `inhibit_rules` уменьшают шум.
- [ ] Понимаете дерево `routes` и `match`.

**Дальше:** [10. Лаба: routing](10-lab-routing.md).
