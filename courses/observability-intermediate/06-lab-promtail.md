# 06. Лаба: Promtail pipeline

## Цель

Добавить **pipeline_stages** для логов Docker: распаковать JSON Docker, извлечь `level` из строки (regex), отфильтровать шум, проверить новые labels в Loki.

## Подготовка

Стек с логами:

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
```

## Задание 1. Базовый pipeline для Docker JSON

В `config/promtail.yml` в job `docker` добавьте после `relabel_configs`:

```yaml
    pipeline_stages:
      - docker: {}
```

Перезапуск:

```bash
docker compose -f docker-compose.yml -f docker-compose.logs.yml restart promtail
```

Проверьте логи promtail — нет ошибок парсинга.

## Задание 2. Regex для уровня логирования

Многие образы пишут `level=info` или `INFO`. Добавьте stage:

```yaml
      - regex:
          expression: '(?P<level>(INFO|WARN|ERROR|DEBUG|level=\w+))'
      - labels:
          level:
```

*Примечание:* для полей вида `level=info` может понадобиться второй regex или `logfmt` — подстройте под реальный лог `mock-prometheus` / `mock-grafana`.

Проверка в Grafana:

```logql
{container="mock-prometheus", level=~"ERROR|error"}
```

## Задание 3. Drop шумных health-check

Если в потоке есть повторяющиеся health (зависит от образа):

```yaml
      - drop:
          expression: ".*/health.*"
          drop_counter_reason: health
```

Метрика в Promtail metrics (`http://localhost:9080/metrics` — порт не проброшен наружу; смотрите через `docker compose exec promtail wget -qO- localhost:9080/metrics | grep drop`):

- счётчик `promtail_dropped_entries_total` с reason `health`.

## Задание 4. Документирование кардинальности

В файле `notes-promtail.md` (в каталоге курса или `/tmp`) ответьте:

1. Какие **три** поля можно безопасно вынести в labels на production?
2. Какое поле **нельзя** (пример с `user_id`)?
3. Что изменится в Loki, если вынести `request_id` в label?

## Задание 5. *Опционально* — multiline

Для Java/Kafka stack trace добавьте (справочно, без обязательного Kafka-стенда):

```yaml
      - multiline:
          firstline: '^\d{4}-\d{2}-\d{2}'
          max_wait_time: 3s
```

## Ожидаемый результат

| Проверка | Критерий |
|----------|----------|
| docker stage | Логи читаемы в Explore |
| label `level` | Появляется хотя бы на одном контейнере |
| drop | Счётчик drop растёт при наличии health в логах |
| notes | Ответы на 3 вопроса кардинальности |

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| label level пустой | Regex не совпал — посмотрите сырую строку в Explore |
| Promtail restart loop | YAML отступы; `docker compose logs promtail` |
| После labels «No data» | Слишком жёсткий selector — уберите level из запроса |

## Чек-лист

- [ ] `pipeline_stages` добавлены
- [ ] LogQL с новым label работает
- [ ] Заметки по кардинальности написаны

**Дальше:** [07. SLO, SLI, SLA](07-slo-sli-sla.md).
