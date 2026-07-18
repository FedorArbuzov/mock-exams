# Observability для курсов observability-*

Локальный стенд: **Prometheus**, **Grafana**, **Alertmanager**, **demo-app**, **node-exporter**, **cAdvisor**. Overlays: **Loki/Promtail**, **OTel/Jaeger**.

Курсы: [observability-basic](../../courses/observability-basic/README.md), [observability-intermediate](../../courses/observability-intermediate/README.md), [observability-advanced](../../courses/observability-advanced/README.md).

## Запуск (базовый стек)

```bash
cd deploy/observability
docker compose up -d --build
docker compose ps
```

| Сервис | URL |
|--------|-----|
| Prometheus | [http://localhost:9090](http://localhost:9090) |
| Grafana | [http://localhost:3000](http://localhost:3000) — `admin` / `admin` |
| Alertmanager | [http://localhost:9093](http://localhost:9093) |
| demo-app | [http://localhost:8000](http://localhost:8000) — `/metrics` |
| cAdvisor | [http://localhost:8082](http://localhost:8082) |

Рекомендуется **4+ ГБ RAM** для Docker.

## Smoke test

```bash
bash scripts/smoke.sh
bash scripts/traffic.sh
# Windows: .\scripts\smoke.ps1
```

## Логи (intermediate)

```bash
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
```

| Сервис | Порт |
|--------|------|
| Loki | `3100` |
| Promtail | `9080` (внутренний) |

В Grafana datasource **Loki** подключается автоматически (provisioning).

## Traces (advanced)

```bash
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d
```

| Сервис | Порт |
|--------|------|
| Jaeger UI | [http://localhost:16686](http://localhost:16686) |
| OTLP gRPC | `4317` |
| OTLP HTTP | `4318` |

Добавьте scrape OTel в Prometheus (см. `config/prometheus-otel.yml` и лабу advanced).

## Kubernetes (advanced, опционально)

После `mockctl up` и Helm — **kube-prometheus-stack** как в [kuber-advanced/14-observability](../../courses/kuber-advanced/14-observability.md):

```bash
kubectl port-forward -n monitoring svc/kube-prom-grafana 3000:80
```

## Сброс

```bash
docker compose down -v
# с overlays:
docker compose -f docker-compose.yml -f docker-compose.logs.yml down -v
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Grafana «No data» | Проверьте datasource Prometheus → `http://prometheus:9090` |
| `up==0` для demo-app | `docker compose logs demo-app`, пересоберите `--build` |
| Promtail без логов (Windows) | Docker socket должен быть доступен; иначе лаба — ручной push в Loki |
| Alertmanager пустой | Сгенерируйте трафик и подождите `for:` в правиле |
| OOM | Уменьшите retention или остановите cAdvisor |
