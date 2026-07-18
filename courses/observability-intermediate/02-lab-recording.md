# 02. Лаба: Recording rules для demo-app

## Цель

Добавить **recording rules** для RPS и доли 5xx, убедиться что они появились в Prometheus, построить простую панель в Grafana.

## Подготовка

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/smoke.sh
bash scripts/traffic.sh
```

Откройте Prometheus: http://localhost:9090.

## Задание 1. Файл правил

Создайте `deploy/observability/config/rules/recording-demo.yml`:

```yaml
groups:
  - name: recording_demo
    interval: 30s
    rules:
      - record: demo:http_requests:rate5m
        expr: sum(rate(demo_http_requests_total[5m]))

      - record: demo:http_errors:rate5m
        expr: sum(rate(demo_http_requests_total{status=~"5.."}[5m]))

      - record: demo:http_error_ratio:rate5m
        expr: |
          demo:http_errors:rate5m
          /
          demo:http_requests:rate5m
```

Файл подхватится автоматически (`rule_files: .../rules/*.yml`).

## Задание 2. Reload

```bash
curl -X POST http://localhost:9090/-/reload
```

Проверка:

1. **Status → Rules** — группа `recording_demo`, состояние OK.
2. Запрос: `demo:http_requests:rate5m` — ненулевой график после `traffic.sh`.

## Задание 3. Сравнение с «сырым» PromQL

В **Graph** выполните оба выражения на одном графике:

```promql
demo:http_requests:rate5m
sum(rate(demo_http_requests_total[5m]))
```

Кривые должны совпасть (допустим микроскопический сдвиг по времени evaluation).

## Задание 4. Панель в Grafana

1. http://localhost:3000 → **Explore** или новый Dashboard.
2. Панель **Time series**: `demo:http_requests:rate5m`, legend «RPS».
3. Панель **Gauge** или **Stat**: `demo:http_error_ratio:rate5m * 100`, unit **Percent**.

Сохраните дашборд как `Demo Recording` (по желанию — provisioning в `config/grafana/...` не обязателен для лабы).

## Задание 5. *Усложнение*

Добавьте breakdown по `status` без взрыва кардинальности:

```yaml
- record: demo:http_requests:rate5m_by_status
  expr: sum(rate(demo_http_requests_total[5m])) by (status)
```

Перезагрузите rules. В Grafana — stacked graph по `status`.

## Ожидаемый результат

| Проверка | Критерий |
|----------|----------|
| Rules | `recording_demo` зелёная |
| Метрики | `demo:http_*` отвечают в PromQL |
| Дашборд | RPS и % ошибок читаются без длинного expr в UI |

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Rules не появились | Синтаксис YAML; `docker compose logs prometheus` |
| `NaN` на ratio | Нет трафика — снова `traffic.sh` |
| Reload 404 | Нет `--web.enable-lifecycle` — `docker compose restart prometheus` |

## Чек-лист

- [ ] Создан `recording-demo.yml`
- [ ] Reload выполнен
- [ ] Две панели в Grafana

**Дальше:** [03. Loki и LogQL](03-loki-logql.md) — поднимем overlay с логами.
