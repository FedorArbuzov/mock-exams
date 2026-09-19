# 12. Lab: restart one at a time

## Ticket

P2 — change window

Restart all brokers for a JVM flag drill. Producers with `acks=all` must not see a full outage. Stop the fleet if URP sticks.

## Task 1. Preflight

`playbooks/preflight.yml`:

- every `kafka_broker` unit is `active`
- `--under-replicated-partitions` is empty
- chrony active
- `df` on `log.dirs` is not critically full (fail if use% ≥ 95)

Author picture: [`examples/playbooks/preflight.yml`](examples/playbooks/preflight.yml).

## Task 2. Rolling play

`playbooks/rolling-restart.yml`: import preflight, then `serial: 1` on `kafka_broker`:

1. restart the broker unit (and controller unit if it is a **separate** service on that host)
2. wait for systemd `active`
3. wait until URP is empty (retries, `delegate_to` one living broker or localhost CLI)
4. `rescue` → `fail`

```bash
ansible-playbook playbooks/rolling-restart.yml
```

Watch `shop.orders` describe while it runs if you want.

## Success criteria

- [ ] three restarts, one host at a time
- [ ] URP empty at the end
- [ ] `--list` still works
- [ ] README: how to open the window

Next: [13. Replace a broker](13-replace.md).
