# 05. Baseline next to ClickHouse

`roles/cluster` already owns packages, `config.d`, Keeper raft, systemd units. If `common` restarts `clickhouse-server` “to be safe,” you will drop connections on every apply.

`common`: chrony, sshd, `jq`/`htop`. No `max_server_memory_usage`. No `users.d` (schema play). No `remote_servers`.

Clocks matter: Keeper sessions and replica `is_session_expired`. Two NTP clients on one box is how people get unexplained readonly.

`--check --diff` before the first apply.

## What belongs in `common`

| Do | Do not |
|----|--------|
| `chrony`, `jq`, `htop` | edit `config.d` or Keeper raft |
| sshd: no passwords, no root login | `systemctl restart` Server or Keeper |
| | `apt full-upgrade` of `clickhouse-*` |

## Checklist

- [ ] You can name three things `roles/cluster` already did
- [ ] `common` must not notify ClickHouse units
- [ ] You will `--check --diff`

Next: [06. Lab: `common`](06-lab-baseline.md).
