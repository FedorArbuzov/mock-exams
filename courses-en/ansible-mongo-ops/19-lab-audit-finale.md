# 19. Monday audit and finale

## Ticket — audit

`playbooks/audit.yml` reports only:

- sshd policy + chrony
- `mongod` active on all three
- `mongodb_status` — one PRIMARY, two SECONDARY
- `shop` exists (query the PRIMARY)
- a stamp exists under `backups/` (after lesson 14)

Break chrony or sshd on one node — audit red. `site.yml --tags baseline` — green. Audit must not repair sshd itself.

## Finale

| # | Criterion |
|---|-----------|
| 1 | `site.yml --tags baseline` |
| 2 | `objects.yml` + Vault |
| 3 | preflight + rolling wrapper |
| 4 | backup play + `backups/` gitignored |
| 5 | runbooks including human-gated stepDown |
| 6 | audit green |
| 7 | README: two trees, `rs.status`, PRIMARY discovery, collection **1.7.12**, MongoDB **7.0**, replace vs resync, `w:majority` vs `w:3` vs quorum |

```bash
cd ~/nimbus-mongo
ansible-playbook playbooks/audit.yml --ask-vault-pass
bash scripts/verify.sh
```

Copy [`examples/scripts/verify.sh`](examples/scripts/verify.sh).

### Demo (5 min)

1. `ansible-inventory --graph`
2. `rs.status()` — one PRIMARY, two SECONDARY
3. `shop` + `shop_app` on the PRIMARY
4. `ls backups/`
5. One sentence: `geerlingguy.mongodb` is one instance; this repo is replica set `nimbus`

## After

- [`ansible-postgres-ops`](../ansible-postgres-ops/README.md) — same ops-repo idea, Patroni
- [`ansible-kafka-ops`](../ansible-kafka-ops/README.md) — quorum + write contract (`min.isr`)
- [`ansible-clickhouse-ops`](../ansible-clickhouse-ops/README.md) — same idea, ClickHouse + Keeper
- [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) — same idea, Kubernetes
- [`gitlab-cicd`](../gitlab-cicd/README.md) — lint this repo
