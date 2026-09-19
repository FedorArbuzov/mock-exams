# 13. Disaster kit

A replica is not a backup. You need a copy **off** the nodes.

This course does **not** repeat [`postgresql-ops`](../postgresql-ops/README.md) (pgBackRest/WAL-G depth). You take a **physical** copy to `~/nimbus-pg/backups/<stamp>/`.

## Minimum kit

| Piece | How |
|-------|-----|
| `pg_basebackup` from the **leader** (or a replica with `pg_basebackup -X stream`) | `fetch` to the host |
| Autobase inventory + `group_vars` | already on the host — copy into the stamp dir |
| Superuser / replication creds | Vault, not next to the tarball in git |

Autobase can install pgBackRest (`enable_backups` / `backup_pgcluster`). Optional bonus after `pg_basebackup` works. Do not start there — one working `basebackup` beats a half-configured repo host.

`.gitignore` `backups/`.

Next: [14. Lab: basebackup](14-lab-backup.md).
