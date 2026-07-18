# 09. Лаба: Alertmanager — firing, silence, своё правило

## Цель лабы

Увидеть **встроенные** алерты стенда в Prometheus и Alertmanager; вызвать **DemoTargetDown**; добавить правило из [`examples/alert-rule.yml`](examples/alert-rule.yml) (или LabHigh404Rate).

## Предварительно

```bash
cd deploy/observability
docker compose up -d --build
```

Правила: `config/rules/demo-alerts.yml`. Alertmanager: [http://localhost:9093](http://localhost:9093).

---

## Задание 1. Alerts в Prometheus

**Зачем:** Pending → Firing.

1. [http://localhost:9090/alerts](http://localhost:9090/alerts)
2. Найдите `DemoTargetDown`, `DemoHighErrorRate`.

**Что увидите:** состояние **Inactive** (зелёный) при здоровом стенде.

---

## Задание 2. Firing при остановке demo-app

```bash
docker compose stop demo-app
```

Подождите **> 1m** (`for: 1m` у `DemoTargetDown`).

1. Prometheus **Alerts** — `DemoTargetDown` → **Firing**
2. Alertmanager → **Alerts** — та же запись

**Что увидите:** labels `severity=critical`, annotation summary.

Восстановите:

```bash
docker compose start demo-app
```

Через пару минут — **Resolved**.

---

## Задание 3. Error rate (опционально)

Сгенерируйте много 404:

```bash
for i in $(seq 1 500); do curl -sf http://localhost:8000/missing >/dev/null 2>&1 || true; done
bash scripts/traffic.sh
```

Проверьте `DemoHighErrorRate` (порог 5% **5xx** — на стенде в основном 404; правило может остаться Inactive). Обсудите: для 404 нужно **отдельное** правило — см. пример ниже.

---

## Задание 4. Своё правило 404

**Зачем:** связать теорию и файл-пример.

Скопируйте `LabHigh404Rate` из [`examples/alert-rule.yml`](examples/alert-rule.yml) в `deploy/observability/config/rules/lab-basic.yml` (новый файл в той же папке).

Перезагрузите Prometheus:

```bash
docker compose restart prometheus
```

Или отправьте SIGHUP, если настроен lifecycle API.

Сгенерируйте трафик:

```bash
bash scripts/traffic.sh
```

Подождите **> 2m**. Проверьте **Alerts**.

**Что увидите:** при достаточной доле 404 — **Firing** `LabHigh404Rate`.

---

## Задание 5. Silence в Alertmanager UI

**Зачем:** плановые работы без паники.

1. Alertmanager → **Silences → New**
2. Matchers: `alertname=DemoTargetDown`
3. Duration: 1h, Comment: `lab maintenance`

Повторите `stop demo-app` — alert не должен беспокоить receiver (на стенде и так void).

**Снимите silence** после лабы.

---

## Задание 6. promtool (опционально)

Если установлен `promtool`:

```bash
promtool check rules deploy/observability/config/rules/demo-alerts.yml
```

**Что увидите:** `SUCCESS` или список синтаксических ошибок.

---

## Критерии успеха

- [ ] Найдены правила в Prometheus UI
- [ ] `DemoTargetDown` переходит в Firing при stop demo-app
- [ ] Alertmanager показывает тот же alert
- [ ] Добавлено и проверено правило на 404 (или объяснено, почему Inactive)
- [ ] Создан и удалён test silence

## Что унести в работу

- Любое новое правило — **`promtool check rules`** + тест на стенде
- `for` согласуйте с **временем восстановления** сервиса

Следующий урок: [10. Золотые сигналы](10-golden-signals.md).
