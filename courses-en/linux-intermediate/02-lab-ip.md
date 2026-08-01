# 02. Lab: ip, routes, and the stand map

## Lab goal

You won't just run commands — you will **build a network map** of the lab stand: your IP, the gateway, which neighbors are alive, what srv1 is listening on. This map will be a cheat sheet for all the following labs (DNS, firewall, nginx).

## Prerequisites

- Docker Desktop / Engine is running.
- From the repository directory:

```bash
cd deploy/linux
docker compose up -d
docker compose ps
```

All containers **Up**. If **Restarting** — wait 60 seconds.

- Log in to lab:

```bash
docker compose exec lab bash
```

SSH accounts on srv*: **course** / **course**.

---

## Preparing the stand

Inside lab:

```bash
whoami
hostname
ping -c1 127.0.0.1
```

If there's no `ping`: `apt install -y iputils-ping`.

---

## Task 1. Your IP address

**Why:** without this you can't tell whether "you are in the same subnet" as srv1.

```bash
ip -4 -br addr
ip -4 addr show
```

**What you'll see** (example):

```text
eth0@ifXX    UP    172.28.0.10/24
```

Write down in a notepad:

```text
My host: lab
My IP:   172.28.0.10
Mask:    /24 (255.255.255.0)
```

**If the IP is not 172.28.0.10** — it may be a different compose network; use **your** IP in the following steps.

**If the interface is DOWN:** `docker compose restart lab`.

---

## Task 2. Routing table

**Why:** to understand whether a packet will go to a neighbor directly or through the gateway.

```bash
ip route show
```

Typical output:

```text
default via 172.28.0.1 dev eth0
172.28.0.0/24 dev eth0 proto kernel scope link src 172.28.0.10
```

The first line is the **default route** (internet, if any). The second — "the whole 172.28.0.0/24 subnet — directly through eth0".

Details of "where the kernel will send the packet":

```bash
ip route get 172.28.0.11
ip route get 172.28.0.53
ip route get 1.1.1.1
```

**What you'll see for .11:**

```text
172.28.0.11 dev eth0 src 172.28.0.10 uid 0
    cache
```

No word **via** — no gateway needed, this is a **neighbor**.

**For 1.1.1.1** — often `via 172.28.0.1`. If `RTNETLINK answers: Network is unreachable` — lab has no internet access; **for the neighbor labs this is normal**.

---

## Task 3. Polling neighbors (ping)

**Why:** a "who's alive" table on the stand network.

```bash
for ip in 11 12 20 53; do
  printf "172.28.0.%s: " "$ip"
  if ping -c1 -W1 172.28.0.$ip >/dev/null 2>&1; then
    echo UP
  else
    echo DOWN
  fi
done
```

| IP | Expected host |
|----|----------------|
| 172.28.0.11 | srv1 |
| 172.28.0.12 | srv2 |
| 172.28.0.20 | web |
| 172.28.0.53 | dns |

**If DOWN:** `docker compose ps` on the host — bring the container up.

**Why ping if there's curl:** ping is L3 (ICMP). You can ping, but HTTP may be closed by the firewall — different layers.

---

## Task 4. Ports on srv1 (L4)

**Why:** to connect "the network is there" with "the service accepts connections".

```bash
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new course@172.28.0.11 'hostname; ss -tlnp | grep -E ":22|:80" || ss -tlnp | head -10'
```

**What you'll see:** `sshd` on **:22**. Port **:80** — if nginx is installed.

If SSH asks for a password — **course**.

Install nginx for practice (optional):

```bash
ssh course@172.28.0.11 'sudo apt update && sudo apt install -y nginx && sudo systemctl enable --now nginx'
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://172.28.0.11/
```

---

## Task 5. ARP — neighbor on the link (optional)

**Why:** to see the IP ↔ MAC mapping in the bridge.

```bash
ping -c1 172.28.0.11 >/dev/null
ip neigh show | grep 172.28.0.11
```

**What you'll see:** `REACHABLE` or `STALE` and a MAC address.

---

## Task 6. Final table (fill it in yourself)

Copy into `~/lab-network-map.txt`:

```text
# linux-intermediate stand map
lab:  172.28.0.10  $(ip -4 -br addr | awk '/UP/{print $3}')
srv1: 172.28.0.11  ping: ...
srv2: 172.28.0.12  ping: ...
web:  172.28.0.20  ping: ...
dns:  172.28.0.53  ping: ...
default gw: $(ip route | awk '/default/{print $3}')
```

---

## Success criteria

- [ ] The lab IP is recorded
- [ ] `ip route get 172.28.0.11` runs without error
- [ ] ping to srv1 succeeds
- [ ] SSH to srv1 showed the hostname
- [ ] The file `lab-network-map.txt` is created

## What to take away

- Diagnostics: **addr → route → ping → ss → curl** (bottom to top).
- The stand IP map — keep it handy until the end of intermediate.

Next lesson: [03. DNS](03-dns.md).
