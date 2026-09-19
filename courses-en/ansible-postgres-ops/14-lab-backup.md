# 14. Lab: basebackup off the node

## Ticket

P2 — DR

If all three LXC die we have nothing. Put a basebackup on the control node.

## Task

`playbooks/backup-cluster.yml`:

1. Find the leader
2. `pg_basebackup` to `/var/backups/nimbus/pg` on that host (or a replica)
3. `fetch` / tar + fetch to `~/nimbus-pg/backups/<stamp>/`
4. Fail if the directory is empty

Picture: [`examples/playbooks/backup-cluster.yml`](examples/playbooks/backup-cluster.yml).

Do not restore **onto the live datadir**. Side restore is [14b](14b-lab-restore.md).

## Success criteria

- [ ] stamp dir on the host has backup files
- [ ] not in git
- [ ] `patronictl list` still healthy

Next: [14b. Lab: prove the kit](14b-lab-restore.md).
