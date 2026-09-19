# 14. Lab: backup off the node

## Ticket

P2 — DR

If all three LXC die we have nothing. Put a ClickHouse backup on the control node.

## Task

`playbooks/backup-cluster.yml`:

1. Pick a healthy replica (`ch-01` is fine if preflight is green)
2. `BACKUP DATABASE shop TO File('/var/backups/nimbus-ch/shop.zip')` via `clickhouse-client`
3. tar + `fetch` to `~/nimbus-ch/backups/<stamp>/`
4. Copy inventory / cluster version note into the stamp (or a `MANIFEST.txt`)
5. Fail if the fetched file is empty

Picture: [`examples/playbooks/backup-cluster.yml`](examples/playbooks/backup-cluster.yml).

Do **not** restore. If `BACKUP` errors on `allowed_path`, the installer fragment in `config.d/backups.xml` is missing — that is an installer fix, not an incident XML hack on one node.

## Success criteria

- [ ] stamp dir on the host has backup bytes
- [ ] not in git
- [ ] all three servers still up, `shop.events` writable
- [ ] README: restore is not this playbook

Next: [15. Replace](15-replace.md).
