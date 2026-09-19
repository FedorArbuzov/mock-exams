# 17. Runbooks

ON-CALL Slack is not a repo. Playbooks:

| Playbook | Job |
|----------|-----|
| `runbooks/gather.yml` | journals of Server + Keeper → `artifacts/` |
| `runbooks/disk-gc.yml` | `df`; delete `/var/tmp/nimbus-junk` only — **never** `/var/lib/clickhouse` |
| `runbooks/readonly.yml` | show `system.replicas`; `SYSTEM RESTART REPLICA` / `SYSTEM RESTORE REPLICA` on the broken host — not a fleet wipe |
| `runbooks/keeper-health.yml` | Keeper units + `mntr` / four-letter; start **one** dead Keeper unit if it is failed |

## Readonly

Print `is_readonly`, `is_session_expired`, `queue_size`. Mutate **one** replica: `SYSTEM RESTART REPLICA shop.events`, then `SYSTEM RESTORE REPLICA` if metadata is gone. `ATTACH TABLE` if you `DETACH`’d in [18c](18c-lab-readonly.md).

Do not fold “stop two Keepers” into this play. Do not `DROP TABLE ON CLUSTER` to “clear readonly.”

## Disk

ClickHouse fills `/var/lib/clickhouse` because parts and logs grew, not because journald is chatty. Lab seed file: `/var/tmp/nimbus-junk` only. `disk-gc.yml` must not `file: state=absent` on the datadir.

## Keeper

`echo mntr | nc 127.0.0.1 9181` (or `clickhouse-keeper-client`) — sketch it. Starting a dead unit on **one** host is allowed. Starting units on two hosts because “quorum looks sad” is how you race raft.

## Checklist

- [ ] gather vs fix are different playbooks
- [ ] disk-gc does not touch `/var/lib/clickhouse`
- [ ] readonly runbook does not wipe three replicas
- [ ] second run is safe

Next: [18. Lab: incident](18-lab-incident.md).
