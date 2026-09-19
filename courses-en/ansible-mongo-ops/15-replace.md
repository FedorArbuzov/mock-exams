# 15. Replace a member

`mongo-03` disk died. Same name and IP, new OS.

```text
If mongo-03 is PRIMARY — stepDown first
rs.remove / mongodb_replicaset reconfigure
recreate LXC (same .12)
common
cluster roles on that host only (linux, repository, mongod, pymongo, keyfile)
rs.add / mongodb_replicaset members list includes mongo-03 again
wait SECONDARY (initial sync) — mongodb_status
objects.yml still works
```

**Initial sync** copies from a living member. That is expected. Do not “help” by rsyncing `dbPath` unless you already know why that is a bad idea on this stand.

Resync **without** recycling the VM is lab [18c](18c-lab-resync.md), not this replace ticket.

Never `rm -rf` `dbPath` on a node that is still PRIMARY.

Next: [16. Lab: mongo-03](16-lab-replace.md).
