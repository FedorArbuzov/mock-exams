# 16. Lab: mongo-03 disk died

## Ticket

P1 — hardware

Bring `mongo-03` / `.12` back as a SECONDARY.

## Task

1. stepDown if `mongo-03` is PRIMARY
2. Remove the member (`rs.remove` or `mongodb_replicaset` with `reconfigure` — read the module docs for 1.7.12)
3. Recycle LXC (lesson 02 recipe, same IP)
4. `site.yml --limit mongo-03` then the install roles for that host
5. Add the member back. Wait initial sync — `STARTUP2` → SECONDARY
6. `objects.yml` green

Write the exact `rs.remove` / add extra-vars you used in the README.

## Success criteria

- [ ] three members, one PRIMARY, two SECONDARY
- [ ] `shop` writable on the PRIMARY
- [ ] replace order in six bullets

Next: [17. Runbooks](17-runbooks.md).
