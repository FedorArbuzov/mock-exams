# 08b. Lab: shop_app cannot connect

## Ticket

P1 — access

The app on the LXD host cannot auth as `shop_app`. Replica set is healthy. Not iptables. Not a missing PRIMARY.

| Layer | This stand | Prod |
|-------|------------|------|
| Perimeter | LXD NAT | security group 27017 from app subnet |
| Listen | `bindIp` (members + host) | not public `0.0.0.0` without auth |
| Who is allowed | user + auth DB + password | same; optional `authenticationRestrictions` |

## Task 1. Seed

Drop `shop_app` **or** set a restriction that excludes `192.168.59.0/24`. From the host:

```text
mongosh -u shop_app -p … --authenticationDatabase shop 192.168.59.10:27017/shop
```

Must fail. `rs.status()` still has a PRIMARY.

## Task 2. Close

`playbooks/objects.yml` is source of truth. Apply. Connect from the host again.

Do not `bindIp: 127.0.0.1` on a member to “lock it down” — that is a replica-set outage.

## Success criteria

- [ ] you saw auth fail, then succeed
- [ ] three layers in the README
- [ ] you did not touch nftables

Next: [09. stepDown](09-stepdown.md).
