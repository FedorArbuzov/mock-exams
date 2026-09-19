# 15. Replace a replica

`pg-03` disk died. Same name and IP, new OS.

```text
If pg-03 is Leader — switchover first
remove_node / patronictl remove
recreate LXC
common
Autobase add_node  (or deploy with new_node=true — read 2.11.0 docs)
wait Replica/running, lag ~ 0
objects.yml still works
```

`reinit_pgcluster` rebuilds a member that is still in the cluster but has bad data. Use it if you `reset` Postgres without recycling the VM — that is lab [18c](18c-lab-reinit.md), not this replace ticket.

Never `rm -rf` PGDATA on a node that is still the Leader.

Next: [16. Lab: pg-03](16-lab-replace.md).
