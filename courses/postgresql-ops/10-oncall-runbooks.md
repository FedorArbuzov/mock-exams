# 10. On-call runbooks

## Сценарий с работы

03:12 — PagerDuty: «Postgres disk 95%». Дежурный джун удаляет файлы из `pg_wal/`. Кластер не стартует. Senior восстанавливает из backup; postmortem: «runbook сказал проверить archive, но контактов не было и шаг 4 пропущен».

Runbook без структуры и escalation — хуже, чем нет runbook.

## Что вы узнаете

- Шаблон runbook (symptoms → mitigation)
- Готовые примеры в репозитории
- Incident report template
- Дополнительные сценарии для своего playbook

## Шаблон runbook

```markdown
# Runbook: <title>

## Symptoms
- Alerts, user reports

## Impact
- Services, data risk

## Diagnosis (read-only first)
- SQL / commands

## Mitigation
- Immediate safe actions

## Escalation
- When to page senior DBA / vendor

## Post-incident
- Action items, runbook update

## Contacts
- Primary on-call, secondary, manager
```

**Правило:** сначала read-only диагностика, потом `terminate`, `promote`, `restore`.

## Готовые примеры в репо

- [Replication lag](examples/runbooks/replication-lag.md)
- [Disk full](examples/runbooks/disk-full.md)

Прочитайте и дополните **Escalation** и **Contacts**.

## Дополнительные сценарии (создайте)

| Сценарий | Первый запрос |
|----------|---------------|
| Long transaction blocking DDL | `pg_stat_activity` + `state_change` |
| Deadlock storm | `pg_locks`, app logs, `deadlock_timeout` |
| Corrupt index / bloat | `REINDEX CONCURRENTLY`, `pgstattuple` |
| Connection exhaustion | `max_connections`, PgBouncer `SHOW POOLS` |
| Archive failure | `pg_stat_archiver`, `pg_wal` size |
| Failed backup job | `pgbackrest info`, last success metric |

## Incident report

Шаблон: [`templates/incident-report.md`](templates/incident-report.md).

Связь: [advanced/12-lab-troubleshooting](../postgresql-advanced/12-lab-troubleshooting.md), [sre](../sre/README.md).

## Runbook quality checklist

- [ ] Каждый шаг — команда copy-paste
- [ ] «Запрещено» секция (rm pg_wal)
- [ ] Пороги escalation в цифрах
- [ ] Ссылка на dashboard
- [ ] Owner и review date (ежеквартально)

## Типичные ошибки

1. Runbook без контактов escalation.
2. Только mitigation без diagnosis — лечат симптом.
3. Устаревшие команды (recovery.conf vs PG 12+).
4. Нет post-incident action items.

## Чек-лист

- [ ] 6 секций шаблона
- [ ] Прочитаны lag + disk-full examples
- [ ] Создан ≥ 1 свой runbook
- [ ] Incident template знаком
- [ ] Read-only first principle

## Дальше

Лаба: [11-lab-incident.md](11-lab-incident.md).
