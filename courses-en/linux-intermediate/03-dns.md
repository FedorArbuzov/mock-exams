# 03. DNS: resolving and records

## Intro: "the server is reachable by IP, but not by name"

The ticket says: "the application can't connect to `db.internal`". From the jump host you run `ping 10.0.5.42` — it responds. `ping db.internal` — **unknown host**. The problem is neither Postgres nor the firewall: **the name doesn't resolve**. Or it resolves to the **old** IP after a migration — and then the symptoms are even more treacherous.

DNS is a distributed directory of "name → data" (usually an IP). DevOps constantly deals with A records, CNAME, TTL, internal zones, and with **the order** in which your OS asks hosts, cache, and servers.

## What you'll learn

- The resolving order: **/etc/hosts** → **nsswitch** → **stub resolver** → DNS servers.
- The record types **A, AAAA, CNAME, MX, TXT** and when to use each.
- How to ask a specific DNS server via **dig**.
- Where the **lab.local** zone lives in the stand (the dns container).
- How to tell NXDOMAIN, timeout, and "cache with the old IP" apart.

## The resolving chain on Linux

```mermaid
flowchart LR
  App[Application curl ssh]
  NSS[nsswitch hosts]
  Files[/etc/hosts]
  Resolver[systemd-resolved or resolv.conf]
  DNS[DNS server 53]
  App --> NSS
  NSS --> Files
  NSS --> Resolver
  Resolver --> DNS
```

1. The application calls `getaddrinfo("srv1.lab.local")`.
2. **nsswitch** (`/etc/nsswitch.conf`, the `hosts:` line) sets the order, usually `files dns`.
3. **files** — we look at `/etc/hosts`; if the name is found — the answer is ready.
4. **dns** — a query to the resolver (often 127.0.0.53 → systemd-resolved, or directly from `/etc/resolv.conf`).
5. The resolver asks the upstream DNS (corporate, 8.8.8.8, or **172.28.0.53** in our stand).

Check on lab:

```bash
grep '^hosts:' /etc/nsswitch.conf
resolvectl status 2>/dev/null || cat /etc/resolv.conf
getent hosts srv1.lab.local
```

`getent` goes through **the same** chain as applications — handy for debugging.

## /etc/hosts — local overrides

```text
127.0.0.1       localhost
172.28.0.11     srv1.lab.local srv1
172.28.0.20     web.lab.local web
```

Pros: works without DNS, instant for labs. Cons: doesn't scale, easy to desync from reality. In production, hosts is rare, except for break-glass and some containers.

If hosts has `srv1.lab.local` and you're editing BIND — you'll **first** see the IP from hosts, not from DNS.

## Record types

| Type | Content | Example usage |
|-----|------------|----------------------|
| **A** | IPv4 | `web.lab.local → 172.28.0.20` |
| **AAAA** | IPv6 | dual-stack sites |
| **CNAME** | alias to another name | `www` → `lb.example.com` |
| **MX** | mail server | priority + hostname |
| **TXT** | arbitrary text | SPF, DKIM, verification |

A **CNAME** on the domain "apex" (bare `example.com`) is often not allowed — you use A or ALIAS at your DNS provider.

**TTL** (time to live) — how many seconds to cache the answer. A low TTL before a migration means fewer clients with the old IP, more load on DNS.

## dig and host — asking the server explicitly

```bash
dig srv1.lab.local @172.28.0.53 +short
dig @172.28.0.53 web.lab.local A
dig @172.28.0.53 srv1.lab.local ANY
host srv1.lab.local 172.28.0.53
```

`@172.28.0.53` — **ignore** the cache and resolv.conf, go straight to BIND in the stand. Without `@` — it goes to whatever is in `resolv.conf`.

Reverse DNS (IP → name):

```bash
dig -x 172.28.0.11 @172.28.0.53 +short
```

## The lab.local zone in the stand

The **dns** container is **172.28.0.53**. The zone files are in [`deploy/linux/bind`](../../deploy/linux/bind/). After `docker compose up`, the records `srv1.lab.local`, `web.lab.local` should answer with that IP.

Check from lab:

```bash
dig @172.28.0.53 srv1.lab.local +short
dig @172.28.0.53 web.lab.local +short
```

## Common mistakes

| Symptom | Cause | Action |
|---------|---------|----------|
| NXDOMAIN | name is not in the zone | typo, wrong zone |
| SERVFAIL | error on the DNS server | BIND logs, zone syntax |
| timeout | network, fw on 53/udp | `ping 172.28.0.53`, ufw |
| "Old" IP | TTL, cache | `resolvectl flush-caches`, wait for the TTL |
| hosts "overrides" DNS | order files dns | `grep srv1 /etc/hosts` |

## Practical example on the stand

From **lab**, run the full cycle (details in [lab 04](04-lab-dns.md)):

```bash
# 1. Directly to the stand's authoritative DNS
dig @172.28.0.53 srv1.lab.local +short

# 2. Through the system resolver (may differ!)
dig srv1.lab.local +short

# 3. The same as what the application sees
getent hosts srv1.lab.local
```

If (1) and (2) are **different** — look at `/etc/hosts`, `resolv.conf`, the resolved cache. This is a classic post-migration bug: BIND is already updated, but one jump host still has an entry in hosts.

## A record in the zone (to understand BIND)

In [`deploy/linux/bind`](../../deploy/linux/bind/) there's a zone file. A line in the style:

```text
srv1    IN  A   172.28.0.11
```

means: in the **lab.local** zone, the name **srv1** → IPv4. The SOA and NS records say this server is **authoritative** for the zone. Changing srv1's IP means editing the zone + `rndc reload` or restarting BIND, not just hosts on the client.

## In production

In Kubernetes, **CoreDNS** answers `*.svc.cluster.local`. In the cloud — Route53, Cloud DNS, internal BIND/Windows AD. External-dns syncs Ingress → records. The principle is the same: know **who is authoritative** for the zone and don't just edit hosts on one machine.

During a "can't connect after IP change" incident, ask: **Has the TTL passed?** **Have all resolvers updated?** **Is there no override in /etc/hosts on the client?**

## Summary

DNS is a separate layer from "ping by IP". Resolving follows the nsswitch rules; hosts can bypass DNS. **dig @server** is the main debugging tool. In the stand, the authoritative server is **172.28.0.53**. TTL and cache explain "after the move half the clients are on the old IP".

## Checklist

- In what order are `files` and `dns` in nsswitch?
- How does A differ from CNAME?
- How do you query only the stand's dns container?
- What is TTL and why is it lowered before a migration?

Next lesson: [04. Lab: DNS](04-lab-dns.md).
