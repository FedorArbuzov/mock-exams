# 08. Лаба: Error budget и SLO recording

## Цель

Подключить **SLO recording rules**, построить панель availability, смоделировать «сгорание» budget и увидеть алерт (или порог в Grafana).

## Подготовка

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/traffic.sh
```

## Задание 1. SLO rules

Скопируйте [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml) в:

```text
deploy/observability/config/rules/slo-demo.yml
```

Reload:

```bash
curl -X POST http://localhost:9090/-/reload
```

Проверьте метрики:

```promql
slo:demo_availability:ratio5m
slo:demo_errors:ratio5m
```

## Задание 2. Целевой SLO на бумаге

Зафиксируйте в `slo-demo-app.md`:

| Поле | Значение |
|------|----------|
| Сервис | demo-app |
| SLI | HTTP availability (2xx / all) |
| SLO target | 99.5% / 30d (учебный) |
| Error budget | 0.5% запросов могут быть «неуспешными» |

Посчитайте: при **10 000** запросов в день сколько «неуспешных» допустимо за день? (Ответ: 50 при линейной модели.)

## Задание 3. Панель Grafana

Панели:

1. **Stat** — `slo:demo_availability:ratio5m * 100`, threshold: green > 99.5, red ниже.
2. **Time series** — `slo:demo_errors:ratio5m`.
3. **Recording RPS** — `slo:demo_http_requests:rate5m`.

## Задание 4. Симуляция burn

Существующий алерт `DemoHighErrorRate` срабатывает при >5% 5xx. Сгенерируйте 404 (не 5xx) массово:

```bash
for i in $(seq 1 500); do curl -sf http://localhost:8000/missing >/dev/null 2>&1 || true; done
```

Вопрос: **меняется ли** `slo:demo_availability:ratio5m`? Почему? (Подсказка: 404 не в `2..` и не в `5..` — уточните формулу SLI в rules.)

*Усложнение:* измените recording success на `status!~"5.."` (все кроме 5xx) и перезагрузите rules — повторите эксперимент.

## Задание 5. Алерт на burn (опционально)

Добавьте в `slo-demo.yml`:

```yaml
      - alert: DemoSLOAvailabilityLow
        expr: slo:demo_availability:ratio5m < 0.995
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Demo SLO availability below 99.5% (5m window)"
```

Добейтесь срабатывания: остановите `demo-app` (`docker compose stop demo-app`) на 3 минуты — availability упадёт. **Alertmanager:** http://localhost:9093.

Не забудьте `docker compose start demo-app`.

## Ожидаемый результат

| Проверка | Критерий |
|----------|----------|
| Rules `slo_demo` | Green в Prometheus |
| Документ slo | SLI/SLO/budget заполнены |
| Панель | 3 панели работают |
| Понимание | Объяснены 404 vs 5xx для SLI |

## Чек-лист

- [ ] `slo-demo.yml` применён
- [ ] Панель SLO в Grafana
- [ ] Эксперимент с 404 и ответ «почему»

**Дальше:** [09. Alertmanager routing](09-alertmanager-routing.md).
