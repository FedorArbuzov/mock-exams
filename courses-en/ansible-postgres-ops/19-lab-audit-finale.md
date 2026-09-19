# 19. Monday audit and finale

## Ticket — audit

`playbooks/audit.yml` reports only:

- sshd policy + chrony
- Patroni: three members, none stopped
- `shop` exists (query the leader)
- a stamp exists under `backups/` (after lesson 14)

Break chrony or sshd on one node — audit red. `site.yml --tags baseline` — green. Audit must not repair sshd itself.

## Finale

| # | Criterion |
|---|-----------|
| 1 | `site.yml --tags baseline` |
| 2 | `objects.yml` + Vault |
| 3 | preflight + rolling wrapper |
| 4 | backup play + `backups/` gitignored |
| 5 | runbooks including human-gated failover |
| 6 | audit green |
| 7 | README: two trees, `patronictl`, leader discovery, Autobase version, replace extra-vars, reinit vs `add_node` |

```bash
cd ~/nimbus-pg
ansible-playbook playbooks/audit.yml --ask-vault-pass
bash scripts/verify.sh
```

Copy [`examples/scripts/verify.sh`](examples/scripts/verify.sh).

### Demo (5 min)

1. `ansible-inventory --graph`
2. `patronictl list`
3. `\l shop` on the leader
4. `ls backups/`
5. One sentence: ANXS is one instance; this repo is Patroni

## After

- [`kuber-postgres`](../kuber-postgres/README.md) — CNPG
- [`postgresql-ops`](../postgresql-ops/README.md) — pgBackRest/WAL-G depth
- [`gitlab-cicd`](../gitlab-cicd/README.md) — lint this repo
