# 10. On-call runbooks

## Scenario from work

3:12 AM — PagerDuty: "Postgres disk 95%". The junior on-call deletes files from `pg_wal/`. The cluster won't start. A senior restores from backup; the postmortem: "the runbook said to check the archive, but there were no contacts and step 4 was skipped."

A runbook without structure and escalation is worse than no runbook.

## What you'll learn

- The runbook template (symptoms → mitigation)
- Ready-made examples in the repository
- Incident report template
- Additional scenarios for your own playbook

## Runbook template

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

**Rule:** read-only diagnosis first, then `terminate`, `promote`, `restore`.

## Ready-made examples in the repo

- [Replication lag](examples/runbooks/replication-lag.md)
- [Disk full](examples/runbooks/disk-full.md)

Read them and complete the **Escalation** and **Contacts** sections.

## Additional scenarios (create them)

| Scenario | First query |
|----------|---------------|
| Long transaction blocking DDL | `pg_stat_activity` + `state_change` |
| Deadlock storm | `pg_locks`, app logs, `deadlock_timeout` |
| Corrupt index / bloat | `REINDEX CONCURRENTLY`, `pgstattuple` |
| Connection exhaustion | `max_connections`, PgBouncer `SHOW POOLS` |
| Archive failure | `pg_stat_archiver`, `pg_wal` size |
| Failed backup job | `pgbackrest info`, last success metric |

## Incident report

Template: [`templates/incident-report.md`](templates/incident-report.md).

Related: [advanced/12-lab-troubleshooting](../postgresql-advanced/12-lab-troubleshooting.md), [sre](../sre/README.md).

## Runbook quality checklist

- [ ] Each step is a copy-paste command
- [ ] A "forbidden" section (rm pg_wal)
- [ ] Escalation thresholds as numbers
- [ ] A link to the dashboard
- [ ] Owner and review date (quarterly)

## Common mistakes

1. A runbook without escalation contacts.
2. Only mitigation without diagnosis — treating the symptom.
3. Outdated commands (recovery.conf vs PG 12+).
4. No post-incident action items.

## Checklist

- [ ] The 6 template sections
- [ ] Read the lag + disk-full examples
- [ ] Created ≥ 1 runbook of your own
- [ ] Familiar with the incident template
- [ ] Read-only first principle

## Next

Lab: [11-lab-incident.md](11-lab-incident.md).
