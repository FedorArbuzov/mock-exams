# 14. Lab: mongodump off the node

## Ticket

P2 — DR

If all three LXC die we have nothing. Put a dump + keyfile on the control node.

## Task

`playbooks/backup-cluster.yml`:

1. Find the PRIMARY (`mongodb_status`)
2. `mongodump` to `/var/backups/nimbus/mongo` on that host
3. Copy the keyfile (path from role defaults / README)
4. `fetch` / tar + fetch to `~/nimbus-mongo/backups/<stamp>/`
5. Fail if the directory is empty

Picture: [`examples/playbooks/backup-cluster.yml`](examples/playbooks/backup-cluster.yml).

Do not restore in this lab.

## Success criteria

- [ ] stamp dir on the host has dump files **and** a keyfile copy
- [ ] not in git
- [ ] `rs.status()` still healthy

Next: [15. Replace](15-replace.md).
