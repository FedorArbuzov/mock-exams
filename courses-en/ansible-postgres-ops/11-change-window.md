# 11. Change windows

Never restart all Patroni units at once.

```text
preflight           three running, no lag alarm, chrony
serial: 1 replicas  restart patroni (or Autobase restart_pgnode)
wait streaming      replay_lag ~ 0
switchover          old leader becomes replica
restart that node
wait streaming
```

Autobase has `update_pgcluster` and `restart_pgnode`. You may **call** those from a wrapper. The contract is the order above, not the brand of restart.

`rescue`: if a replica does not rejoin, **stop** — do not switchover away from a healthy leader into a mess.

Next: [12. Lab: rolling](12-lab-rolling.md).
