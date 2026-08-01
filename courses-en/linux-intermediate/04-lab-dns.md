# 04. Lab: DNS on the lab.local stand

## Lab goal

Go through the full cycle: a forward query to BIND, reverse DNS, comparing **/etc/hosts** and DNS, temporarily changing **resolv.conf** — so that during an incident you don't confuse "DNS is broken" with "the application is broken".

## Prerequisites

`docker compose ps` — **lab** and **dns** are Up. Work from:

```bash
docker compose exec lab bash
```

Install `dnsutils` if there's no `dig`:

```bash
sudo apt install -y dnsutils
```

---

## Task 1. Forward query to BIND

**Why:** bypass the cache and resolv — ask the stand's authoritative server.

```bash
dig @172.28.0.53 srv1.lab.local +short
dig @172.28.0.53 web.lab.local +short
dig @172.28.0.53 srv1.lab.local
```

**What you'll see:** in `+short` — the IP (expected **172.28.0.11** and **172.28.0.20**, if the zone in bind matches the stand). In the full output — the `ANSWER SECTION`, TTL.

**If SERVFAIL / timeout:** `docker compose ps` — the dns container; `ping -c2 172.28.0.53`.

---

## Task 2. Reverse lookup

**Why:** PTR checks come up in mail and logs.

```bash
dig -x 172.28.0.11 @172.28.0.53 +short
dig -x 172.28.0.20 @172.28.0.53 +short
```

**What you'll see:** a hostname or nothing if PTR isn't configured in the zone — for the lab this is normal, just note the fact.

---

## Task 3. getent and hosts

**Why:** to see the priority of **files** over dns.

```bash
grep lab.local /etc/hosts
getent hosts srv1.lab.local
```

If hosts has **no** srv1 — add it temporarily:

```bash
echo "172.28.0.11 srv1.lab.local srv1" | sudo tee -a /etc/hosts
getent hosts srv1.lab.local
ping -c1 srv1.lab.local
```

**What you'll see:** the IP from hosts, even if DNS says something else.

Remove the line after the experiment if it interferes with the next labs:

```bash
sudo sed -i '/srv1.lab.local/d' /etc/hosts
```

---

## Task 4. resolv.conf (temporarily)

**Why:** to understand how lab learns its DNS by default.

```bash
cp /etc/resolv.conf /tmp/resolv.bak 2>/dev/null || true
cat /etc/resolv.conf
echo 'nameserver 172.28.0.53' | sudo tee /etc/resolv.conf
dig srv1.lab.local +short
sudo cp /tmp/resolv.bak /etc/resolv.conf 2>/dev/null || true
```

In Docker the file may be overwritten on restart — the lab is about the **mechanism**, not a permanent config.

**If dig without @ doesn't use .53** — an explicit `@172.28.0.53` is always correct.

---

## Task 5. Comparing host and dig

```bash
host srv1.lab.local 172.28.0.53
nslookup srv1.lab.local 172.28.0.53
```

**What you'll see:** the same IPs, a different output format.

---

## Task 6. traceroute to web (optional)

```bash
traceroute -n 172.28.0.20 2>/dev/null | head -5 || tracepath -n 172.28.0.20 | head -5
```

In a bridge network there's often a single hop — that's normal.

---

## Success criteria

- [ ] `dig @172.28.0.53` returned the IP for srv1 and web
- [ ] You understand the role of `/etc/hosts` vs DNS
- [ ] `getent hosts` and `ping` by name worked
- [ ] You restored resolv.conf (if you changed it)

## What to take away

- DNS debugging starts with `dig @authoritative`, not with "restarted the application".
- Check hosts before going to war with the DNS admins.

Next lesson: [05. NAT and forwarding](05-nat-forwarding.md).
