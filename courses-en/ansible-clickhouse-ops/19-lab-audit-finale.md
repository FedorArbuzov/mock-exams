# 19. Monday audit and finale

## Ticket — audit

`playbooks/audit.yml` reports only:

- sshd policy + chrony
- `clickhouse-server` and `clickhouse-keeper` active on all three
- `shop` / `shop.events` exist (`ON CLUSTER` / `clusterAllReplicas` or query each host)
- `system.replicas` for `events`: not readonly
- a stamp exists under `backups/` (after lesson 14)

Break chrony or sshd on one node — audit red. `site.yml --tags baseline` — green. Audit must not repair sshd itself.

Do not leave sshd broken.

## Finale

| # | Criterion |
|---|-----------|
| 1 | `site.yml --tags baseline` |
| 2 | `schema.yml` + Vault |
| 3 | preflight + rolling servers (`serial: 1`) |
| 4 | backup play + `backups/` gitignored |
| 5 | runbooks: gather, disk-gc, readonly, keeper-health |
| 6 | audit green |
| 7 | README: two trees, 24.8.x pin, `nimbus` 1×3, Keeper ids 1/2/3, replace keeps id 3, restore is not the backup play |

```bash
cd ~/nimbus-ch
ansible-playbook playbooks/audit.yml --ask-vault-pass
bash scripts/verify.sh
```

Copy [`examples/scripts/verify.sh`](examples/scripts/verify.sh).

### Demo (5 min)

1. `ansible-inventory --graph`
2. `system.clusters` / `system.replicas`
3. `EXISTS TABLE shop.events`
4. `ls backups/`
5. One sentence: Galaxy ClickHouse roles are not the job; this repo is official apt + frozen `config.d` + day-2 playbooks

## After

- [`ansible-postgres-ops`](../ansible-postgres-ops/README.md) — Patroni (other bridge)
- [`ansible-kafka-ops`](../ansible-kafka-ops/README.md) — KRaft (other bridge)
- [`ansible-mongo-ops`](../ansible-mongo-ops/README.md) — replica set
- [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) — Kubespray + ops repo
- [`gitlab-cicd`](../gitlab-cicd/README.md) — lint this repo
