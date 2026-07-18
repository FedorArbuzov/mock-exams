# 10. Лаба: маршрутизация Alertmanager

## Цель

Расширить `alertmanager.yml`: отдельные receivers по **severity** и **team**, проверить группировку и inhibit в UI.

## Подготовка

```bash
cd deploy/observability
docker compose up -d
```

UI: http://localhost:9093.

## Задание 1. Labels в правилах

В `config/rules/demo-alerts.yml` добавьте label `team: demo` к обоим алертам. Reload Prometheus.

## Задание 2. Маршруты

Замените/дополните `config/alertmanager.yml`:

```yaml
route:
  receiver: default
  group_by: ["alertname", "severity", "team"]
  group_wait: 10s
  group_interval: 1m
  repeat_interval: 1h
  routes:
    - match:
        severity: critical
      receiver: critical-log
      continue: false
    - match:
        severity: warning
        team: demo
      receiver: warning-demo

receivers:
  - name: default
  - name: critical-log
    webhook_configs:
      - url: "https://httpbin.org/post"
        send_resolved: true
  - name: warning-demo
    webhook_configs:
      - url: "https://httpbin.org/post"
```

Перезапуск AM:

```bash
docker compose restart alertmanager
```

*Локальная альтернатива:* `python -m http.server 9999` не примет POST — httpbin удобен для учебной проверки «уведомление ушло».

## Задание 3. Провокация critical

```bash
docker compose stop demo-app
sleep 90
```

В **Alertmanager → Alerts** — `DemoTargetDown` **Firing**. В **Silences** не ставьте пока не посмотрите группировку.

Проверьте **Status** → какой receiver сработал для critical.

```bash
docker compose start demo-app
```

## Задание 4. Inhibit

Добавьте временный warning-алерт с тем же `alertname` (для эксперимента) или используйте существующий сценарий:

1. Поднимите error rate (много 5xx сложно на demo — проще **stop demo-app** = critical down).
2. Убедитесь, что warning по другому имени **не** inhibited.

Расширьте inhibit (осознанно):

```yaml
inhibit_rules:
  - source_match:
      alertname: DemoTargetDown
    target_match_re:
      severity: warning
    equal: ["team"]
```

Снова stop demo-app — соседние warning с `team: demo` должны быть **suppressed** в UI (Inhibited).

## Задание 5. Silence на время работ

В UI создайте **Silence** на `alertname=DemoHighErrorRate` на 1h — объясните в заметке, когда silence допустим (maintenance), а когда опасен.

## Ожидаемый результат

| Проверка | Критерий |
|----------|----------|
| Маршруты | critical → `critical-log` |
| Группировка | Одна группа на alertname+severity |
| Inhibit | Warning подавлен при TargetDown (после настройки) |
| Silence | Создан и снят |

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| AM не подхватил конфиг | `docker compose logs alertmanager` — YAML syntax |
| Алерт не firing | `for:` в rule; подождите |
| Webhook 403 | Замените URL на свой httpbin |

## Чек-лист

- [ ] `team` label в rules
- [ ] Два receiver в AM
- [ ] Inhibit проверен в UI

**Дальше:** [11. Гистограммы и квантили](11-histograms-quantiles.md).
