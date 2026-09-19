# 17. Runbooks

| Playbook | Job |
|----------|-----|
| `runbooks/lag.yml` | `mongodb_status`; print member states / optime lag if you query it; start `mongod` if the unit is dead |
| `runbooks/disk-gc.yml` | `df`; delete `/var/tmp/nimbus-junk` only — **never** `dbPath` |
| `runbooks/gather.yml` | journal `mongod` → `artifacts/` |
| `runbooks/stepdown.yml` | human gate, then `mongodb_stepdown` — not inside `lag.yml` |

`lag.yml` starts a dead **secondary** unit. PRIMARY gone is lesson [18b](18b-lab-primary-down.md). Bad secondary data without a new VM is [18c](18c-lab-resync.md).

Lag here means **replication lag / member state**, not Kafka URP. `mongodb_status` returning PRIMARY + SECONDARY is the cheap check. `rs.printSecondaryReplicationInfo()` / `replSetGetStatus.members[].optimeDate` is the grown-up one if you want numbers.

Next: [18. Lab: incident](18-lab-incident.md).
