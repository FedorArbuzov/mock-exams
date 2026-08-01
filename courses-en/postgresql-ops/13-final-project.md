# 13. Final project: Ops Playbook

## Scenario from work

The admin track (basic→advanced) gave you the knowledge. Performance covered tuning. The **Ops Playbook** is the document the on-call uses at 3 AM to restore the service without re-reading 47 lessons.

## Goal

A single **Ops Playbook** (~10+ pages of markdown) for a production PostgreSQL 16 shop API.

## Prerequisites

- Ops courses 01–12
- [intermediate/17-final-project](../postgresql-intermediate/17-final-project.md) — you can fold in the HA/PITR sections

## Structure

```text
docs/postgres-ops-playbook/
├── README.md
├── 01-backup-strategy.md
├── 02-pitr-restore.md
├── 03-blue-green.md
├── 04-oncall-runbooks/
│   ├── replication-lag.md
│   ├── disk-full.md
│   └── connections.md
├── 05-monitoring.md
├── 06-zero-downtime-migrations.md
└── incidents/
    └── example-postmortem.md
```

## Section 1. Backup strategy

- Tool: **pgBackRest** or **WAL-G** (pick one)
- RPO/RTO with justification
- Retention (full/diff/WAL)
- Off-site S3/MinIO, encryption
- **Restore drill:** quarterly, owner, last date, duration
- Link to [03-lab-pgbackrest](03-lab-pgbackrest.md) / [05-lab-wal-g](05-lab-wal-g.md)

## Section 2. PITR

Recovery steps to point-in-time T (from [intermediate/09-pitr](../postgresql-intermediate/09-pitr.md)):

1. Isolate host
2. Stop Postgres
3. Restore base + WAL / pgbackrest restore --type=time
4. recovery_target_time + promote
5. Verify + app cutover

## Section 3. Blue/green

Diagram + checklist from [07-lab-blue-green](07-lab-blue-green.md).  
Scenario: PG 16→17 **or** DC migration.

## Section 4. On-call (at least 3 runbooks)

Each: **Symptoms → Diagnosis → Mitigation → Escalation**

| Runbook | Source |
|---------|----------|
| Replication lag | [examples](examples/runbooks/replication-lag.md) + complete it |
| Disk full / WAL | [examples](examples/runbooks/disk-full.md) |
| Connection exhaustion | create it |

+ an escalation matrix (P2/P1, who to call).

## Section 5. Monitoring

From [12-monitoring-ops](12-monitoring-ops.md):

- Table of metrics and thresholds
- Sketch of the on-call dashboard (ASCII or mermaid)
- Alert → runbook links

## Section 6. Zero-downtime

One **real** expand/contract for the shop schema ([08-zero-downtime](08-zero-downtime.md)):

```text
Example: ADD orders.status, backfill, deploy v2/v3, DROP legacy
```

Mention `CREATE INDEX CONCURRENTLY`.

## Section 7. Postmortem

One completed report from [11-lab-incident](11-lab-incident.md).

## Success criteria

| Level | Criteria |
|---------|----------|
| Pass | 6 sections, 3 runbooks, restore drill scheduled |
| Strong | Escalation matrix, dashboard mock, blue/green 10+ steps |
| Gap | Only a bullet list without commands |

## Related

- [aws-intermediate RDS](../aws-intermediate/README.md)
- [postgresql-advanced DBA playbook](../postgresql-advanced/15-final-project.md)
- [sre/12-disaster-recovery](../sre/12-disaster-recovery.md)

## Self-check

- [ ] The on-call finds PITR in 2 minutes
- [ ] Every alert has a runbook
- [ ] Restore drill on the calendar
- [ ] Escalation contacts filled in

---

**postgresql-ops complete.**
