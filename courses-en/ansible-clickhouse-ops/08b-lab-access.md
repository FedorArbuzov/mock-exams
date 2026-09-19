# 08b. Lab: shop_app cannot connect

## Ticket

P1 — access

`shop_app` from **another node** (or the host) cannot query `ch-01`. Servers are up. Not Keeper. Not iptables.

| Layer | This stand | Prod |
|-------|------------|------|
| Perimeter | LXD NAT | SG / VLAN to 9000–8123 |
| Listen | `config.d/listen.xml` | installer, frozen after lesson 04 |
| Who is allowed | `users.d` `<networks>` | same |

## Task 1. Seed

On all three, set `shop_app` `<networks>` to `127.0.0.1` only. Reload.

```text
# from ch-02
clickhouse-client -h 192.168.60.10 --user shop_app --password … --query "SELECT 1"
```

Must fail. Local `clickhouse-client` on `ch-01` as default user still works.

## Task 2. Close

`playbooks/schema.yml` / `users.d` from git (`192.168.60.0/24`). Apply. Remote `shop_app` works.

Do not `iptables -A INPUT`. Do not edit `listen.xml` in an incident unless bind is actually wrong.

## Success criteria

- [ ] remote reject, then allow from git
- [ ] three layers in the README
- [ ] `shop.events` still ReplicatedMergeTree

Next: [09. Replication](09-replication.md).
