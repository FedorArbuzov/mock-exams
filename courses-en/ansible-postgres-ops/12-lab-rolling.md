# 12. Lab: restart replicas then the leader

## Ticket

P2 — JVM/OS drill (here: Patroni unit restart)

Restart every member without a dual-primary. Replicas first.

## Task

`playbooks/preflight.yml`: `patronictl list` parseable, all running.

`playbooks/rolling-restart.yml`:

1. `hosts: replica` (inventory group — **not** “whoever is replica in Patroni”). After lesson 10 the inventory `replica` group may include the **current leader**. Discover roles: skip the host that `patronictl` says is Leader, or build a dynamic group.
2. `serial: 1` restart Patroni unit, wait until Replica/running and lag is small.
3. Autobase switchover **or** restart the remaining leader last after switchover.

This discovery step is the point. Picture: [`examples/playbooks/rolling-restart.yml`](examples/playbooks/rolling-restart.yml) — adjust unit name.

## Success criteria

- [ ] three running at the end
- [ ] you did not restart Leader and both replicas in one blast
- [ ] `shop` still writable

Next: [13. Disaster kit](13-disaster-kit.md).
