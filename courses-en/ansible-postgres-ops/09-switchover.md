# 09. Switchover vs failover

| | Switchover | Failover |
|--|------------|----------|
| Leader | healthy | dead |
| Command | `patronictl switchover` / Autobase `switchover_pgcluster` | `patronictl failover` / `failover_pgcluster` |
| When | patch window | incident |

Manual `pg_promote()` on a replica while the old primary is alive is how you get two writers. Patroni exists so you do not do that.

After switchover, `nimbus-pg` object plays must still find the new leader. Clients that pinned `pg-01` break — that is the lesson HAProxy would hide. We keep HAProxy off so you **feel** the leader move.

## Checklist

- [ ] You can say switchover vs failover in one sentence
- [ ] You will not `pg_promote()` “to be faster”

Game day (leader process dead) is [18b](18b-lab-failover.md). Do not mix the two tickets.

Next: [10. Lab: switchover](10-lab-switchover.md).
