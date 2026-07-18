# 13. Финальный проект: mini on-call для demo-app

## Введение: собрать basic в один контур

Отдельно вы умеете PromQL, Grafana, targets, алерты и RED. **Финал** — связный **операторский пакет** для [`deploy/observability`](../../deploy/observability/README.md): дашборд, два правила, runbook и симуляция инцидента. Без нового кода приложения — только конфиги, Grafana UI и `scripts/traffic.sh`.

## Что вы узнаете (итог курса)

- Спроектировать **RED dashboard** и **алерты** с согласованными порогами.
- Провести **учебный инцидент** и задокументировать timeline.
- Сформулировать **runbook** из метрик → гипотеза → действие.

## Требования

| # | Требование | Критерий |
|---|------------|----------|
| 1 | Стенд | `docker compose up -d --build`, smoke OK |
| 2 | Dashboard | ≥ 3 панели RED + переменная `job` или `instance` |
| 3 | Алерты | `DemoTargetDown` (или свой `up`) + правило на **404** или **p95** из [`examples/alert-rule.yml`](examples/alert-rule.yml) |
| 4 | PromQL файл | 5+ запросов в `PROJECT-promql.txt` (можно копировать из [`examples/promql-queries.txt`](examples/promql-queries.txt) с комментариями) |
| 5 | Инцидент A | `stop demo-app` → firing → runbook → `start` → resolved |
| 6 | Инцидент B | трафик + высокая доля 404 **или** ручной spike → сработало warning-правило (или объяснение порога) |
| 7 | Документ | `PROJECT.md` по шаблону ниже |
| 8 | Kubernetes (опционально) | 1 абзац: как тот же RED появится в [kuber-advanced/14](../kuber-advanced/14-observability.md) |

---

## Фаза 1. Подготовка стенда

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/smoke.sh
bash scripts/traffic.sh
```

Проверьте:

- [http://localhost:9090/targets](http://localhost:9090/targets) — все UP
- [http://localhost:3000](http://localhost:3000) — Grafana login
- [http://localhost:8000/metrics](http://localhost:8000/metrics) — exposition

---

## Фаза 2. Dashboard «Demo App — Production Ready»

Создайте dashboard (лаба [05](05-lab-dashboard.md)):

| Панель | PromQL (минимум) |
|--------|------------------|
| RPS | `sum(rate(demo_http_requests_total{job="demo-app"}[5m]))` |
| Error rate | доля `status!~"2.."` |
| p95 | `histogram_quantile(0.95, sum by (le)(rate(demo_http_request_duration_seconds_bucket{job="demo-app"}[5m])))` |
| Saturation (бонус) | `demo_http_in_progress` или node CPU |

**UID** и **tags** зафиксируйте в `PROJECT.md`. Скриншоты — опционально.

---

## Фаза 3. Alert rules

1. Убедитесь, что подключены `config/rules/*.yml`.
2. Добавьте **`LabHigh404Rate`** или правило на **p95 > 0.3** (30s) — свой файл `config/rules/project.yml`.
3. `docker compose restart prometheus`
4. `promtool check rules` — если доступен.

Сверьте пороги с **порогами на панелях** (± разумный запас).

---

## Фаза 4. Runbook (шаблон)

В `PROJECT.md` секция **Runbook: demo-app down**:

1. **Симптом:** alert `DemoTargetDown` / `up==0`
2. **Проверка:** Prometheus Targets, `docker compose ps`
3. **Диагностика:** `docker compose logs demo-app --tail 50`
4. **Mitigation:** `docker compose start demo-app` или `up -d --build`
5. **Верификация:** `up{job="demo-app"}==1`, RPS на дашборде
6. **Эскалация:** если не поднялось за 15m — …

Второй runbook — **высокий 404 rate** (ссылка на `traffic.sh` и `/missing`).

---

## Фаза 5. Учебные инциденты

### Инцидент A — недоступность

```bash
docker compose stop demo-app
# ждать firing > 1m
docker compose start demo-app
```

Запишите в `PROJECT.md`: время начала/конца, скрин Prometheus **Alerts**, Alertmanager.

### Инцидент B — качество трафика

```bash
bash scripts/traffic.sh
for i in $(seq 1 300); do curl -sf http://localhost:8000/missing >/dev/null 2>&1 || true; done
```

Проверьте warning rule и панель Error rate.

---

## Фаза 6. Сравнение с Kubernetes (опционально)

Кратко опишите:

- **ServiceMonitor** вместо `static_configs`
- **kube-state-metrics** для pod phase
- **Grafana** из kube-prometheus-stack — [14-observability](../kuber-advanced/14-observability.md)

Лаба k8s: [15-lab-observability](../kuber-advanced/15-lab-observability.md).

---

## Шаблон PROJECT.md

```markdown
# Observability Basic — Final Project

## Автор / дата

## Стенд
- compose revision, RAM Docker

## Dashboard
- URL / title / panels list

## Alerts
| Имя | Expr | for | severity |
|-----|------|-----|----------|

## PromQL (файл PROJECT-promql.txt)
- 5 запросов с пояснением одной строкой

## Инцидент A (down)
- Timeline UTC
- Скрин/описание firing → resolved

## Инцидент B (404 или latency)
- Действия, результат

## Runbooks
- (вставьте две секции)

## Kubernetes notes (optional)

## Выводы
- 3 bullets: что унесли в работу
```

---

## Критерии оценки (самопроверка)

- [ ] Dashboard отвечает на RED без «No data» после трафика
- [ ] Минимум 2 работающих alert rules с разным severity
- [ ] Runbook воспроизводим другим человеком
- [ ] Инцидент A задокументирован с временами
- [ ] PromQL-файл не дублирует слепо примеры — есть свои комментарии
- [ ] Понятна связь со стендом [`deploy/observability/README.md`](../../deploy/observability/README.md)

## Дальше

- [`observability-intermediate`](../observability-intermediate/README.md) — Loki, LogQL, корреляция
- [`observability-advanced`](../observability-advanced/README.md) — OTel, SLO, exemplars
- [`kuber-advanced/14-observability`](../kuber-advanced/14-observability.md) — kube-prometheus-stack

Поздравляем с завершением **Observability — Basic**.
