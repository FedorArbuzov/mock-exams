# 08b. Lab: app pinned one broker

## Ticket

P1 — access / client

The shop producer has `bootstrap.servers=192.168.57.10:9092` only. `kafka-01` is down (or you stop it). Writes die. The cluster still has two brokers.

This is the Kafka version of “who can talk”: not iptables — **listeners + bootstrap list**.

| Layer | This stand | Prod |
|-------|------------|------|
| Perimeter | LXD NAT | SG 9092 from app |
| Listen | Confluent `advertised.listeners` | same; wrong advertise = “works on the box, dies from the app” |
| Who is allowed | open lab, no ACL | ACL / TLS |

## Task

1. Produce with **only** `.10` while all three are up — works.
2. Stop `kafka-01` (one unit). Produce with only `.10` — fails/hangs.
3. Produce with `.11,.12` (or all three) — `acks=all` still works (`min.isr=2`).
4. Start `kafka-01`. Wait URP empty.
5. README: app bootstrap is **three** addresses (or a DNS name). `topics.yml` may keep one bootstrap for the CLI; the app must not.

Do not stop two brokers (KRaft quorum).

## Success criteria

- [ ] you saw single-IP bootstrap die
- [ ] three-IP (or two living) produce worked
- [ ] you did not add nftables

Next: [09. ISR](09-isr.md).
