# 17. Runbooks

| Playbook | Job |
|----------|-----|
| `runbooks/lag.yml` | `pg_stat_replication` / Patroni lag; start Patroni if the unit is dead |
| `runbooks/disk-gc.yml` | `df`; delete `/var/tmp/nimbus-junk` only — **never** PGDATA |
| `runbooks/gather.yml` | journal `patroni` + `postgresql@*` → `artifacts/` |
| `runbooks/failover.yml` | human gate, then Autobase `failover_pgcluster` — not inside `lag.yml` |

`lag.yml` starts a dead **replica** unit. Leader gone is lesson [18b](18b-lab-failover.md). Bad replica data without a new VM is [18c](18c-lab-reinit.md) (`reinit_pgcluster`).

Next: [18. Lab: incident](18-lab-incident.md).
