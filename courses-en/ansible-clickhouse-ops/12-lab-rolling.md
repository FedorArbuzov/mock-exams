# 12. Lab: rolling server restart

## Ticket

P2 — change window

Restart every **clickhouse-server** for a package/CVE drill. Inserts must not see a full outage. Optional: roll Keepers **after**, serial 1.

## Task 1. Preflight

`playbooks/preflight.yml`:

- every Server and Keeper unit is `active`
- `system.replicas` for `shop.events`: `is_readonly = 0` on each living query
- chrony active
- `df` on `/var/lib/clickhouse` is not critically full (fail if use% ≥ 95)

Author picture: [`examples/playbooks/preflight.yml`](examples/playbooks/preflight.yml).

## Task 2. Rolling servers

`playbooks/rolling-restart.yml`: import preflight, then `serial: 1` on `clickhouse`:

1. restart `clickhouse-server` only (not Keeper)
2. wait systemd `active`
3. wait `is_readonly = 0` and `queue_size` small (`delegate_to` a living host or the same host)
4. `rescue` → `fail`

```bash
cd ~/nimbus-ch
ansible-playbook playbooks/preflight.yml
ansible-playbook playbooks/rolling-restart.yml
```

## Task 3. Optional Keeper roll

After all three servers are writable: `serial: 1` on `clickhouse_keeper`, restart `clickhouse-keeper`, wait servers still insert. **Do not** do this if Task 2 left a readonly replica.

## Success criteria

- [ ] three server restarts, one host at a time
- [ ] you did not restart all Keepers in one blast
- [ ] `shop.events` still writable (`insert_quorum=2`)
- [ ] README: how to open the window

Next: [13. Disaster kit](13-disaster-kit.md).
