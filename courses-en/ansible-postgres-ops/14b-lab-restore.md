# 14b. Lab: prove the kit (do not eat the cluster)

## Ticket

P2 — DR rehearsal

Lesson 14 only **fetched** a basebackup. Interview: “so you can restore?” Yes — onto a **throwaway** directory. Not onto the live PGDATA. Not `patronictl` recreate.

## Task

On the **control node** (or one LXC under `/tmp`, never the live datadir):

```text
mkdir -p /tmp/nimbus-pg-restore
# unpack backups/<stamp>/ here
pg_controldata /tmp/nimbus-pg-restore    # or pg_verifybackup if the stamp is a pg_basebackup dest
ls PG_VERSION backup_label
```

Do **not** start `postgres` on `5432`. Do **not** point Patroni at this directory. Do **not** `rm -rf` PGDATA on a member.

README: six bullets you would run in a real disaster (new empty VM → restore → `pg_rewind` / rebuild replicas). This lab stops at “the file is a cluster.”

## Success criteria

- [ ] `pg_controldata` / `pg_verifybackup` succeeded
- [ ] live `patronictl list` unchanged
- [ ] restore play is **not** folded into `backup-cluster.yml`

Next: [15. Replace](15-replace.md).
