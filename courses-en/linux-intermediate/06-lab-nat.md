# 06. Lab: forwarding and Docker NAT

## Lab goal

Understand in practice three things from the [NAT theory](05-nat-forwarding.md):

1. **ip_forward** — whether the kernel is allowed to forward packets between interfaces.
2. **Route and SNAT** — why "internet from a container" may not work even though there's ping inside the lab network.
3. **Docker DNAT** — how `ports:` in compose turns into iptables rules on the host.

You are **not** configuring lab as an internet gateway — you only observe how it's done in Docker.

## Prerequisites

- You've read [05. NAT and forwarding](05-nat-forwarding.md).
- Stand: `cd deploy/linux && docker compose up -d`.
- Session in lab: `docker compose exec lab bash`.

---

## Preparing the stand

```bash
hostname
ip -br a
ip route
```

Write down the default route (if any) and the interface with the address **172.28.0.10**.

---

## Task 1. IP forwarding

**Why:** without `ip_forward=1`, Linux doesn't route other machines' packets between interfaces — a typical cause of "NAT doesn't work" on your own VPS gateway.

```bash
cat /proc/sys/net/ipv4/ip_forward
sysctl net.ipv4.ip_forward
```

**What you'll see:** most often **1** in the lab container (Docker enables forwarding for the bridge).

**If 0:**

```bash
sudo sysctl -w net.ipv4.ip_forward=1
cat /proc/sys/net/ipv4/ip_forward
```

**If it doesn't work:** no permissions — you're not in lab or there's no sudo.

---

## Task 2. Route to "the outside"

**Why:** to tell "no NAT on the host" from "no default route in the container".

```bash
ip route show default
ip route get 1.1.1.1
curl -s --connect-timeout 3 -o /dev/null -w "https example.com: %{http_code}\n" https://example.com || echo "no outbound from lab (OK for lab)"
```

| curl result | Interpretation |
|----------------|---------------|
| 200/301/302 | outbound internet from lab exists |
| timeout / failed | no route or SNAT on the host — **normal** for a lab network |

The internal network **172.28.0.0/16** works independently regardless.

---

## Task 3. Internal connectivity (without NAT)

**Why:** to confirm that L3 between containers doesn't require DNAT.

```bash
ping -c2 172.28.0.11
ping -c2 172.28.0.20
curl -s -o /dev/null -w "web direct: %{http_code}\n" http://172.28.0.20/ 2>/dev/null || echo "web:80 not up"
```

**What you'll see:** ping replies; curl to web — 200, if nginx is up on web.

This is **direct** L3: packet lab → 172.28.0.20, without publishing ports on the host.

---

## Task 4. NAT table

**Why:** to see the **DOCKER** / **DNAT** chains (the names depend on the backend: iptables-nft vs legacy).

On lab (if you have permissions):

```bash
sudo iptables-nft -t nat -L -n 2>/dev/null | head -40
# or
sudo iptables -t nat -L -n 2>/dev/null | head -40
```

**What you'll see:** the `DOCKER` chains, `DNAT` rules with ports — or empty, if the container doesn't have full netfilter.

On the **host** (the `deploy/linux` directory, outside lab):

```bash
docker compose ps
docker compose port web 80 2>/dev/null
docker port $(docker compose ps -q web 2>/dev/null) 2>/dev/null
```

**What you'll see:** something like `0.0.0.0:32768->80/tcp` — the host listens on a random/assigned port and **forwards** into the web container.

**Link to theory:** this is **DNAT**: client → host IP:PORT → IP:80 inside the container.

---

## Task 5. Two paths to the same nginx

**Why:** to reinforce the difference "inside the docker network" vs "from the host through publish".

From **lab**:

```bash
curl -s -o /dev/null -w "from lab to 172.28.0.20: %{http_code}\n" http://172.28.0.20/
```

From the **host** (substitute the port from `docker compose port web 80`):

```bash
curl -s -o /dev/null -w "from host published port: %{http_code}\n" http://127.0.0.1:PORT/
```

| Path | NAT? |
|------|------|
| lab → 172.28.0.20 | no, L2/L3 bridge |
| host → 127.0.0.1:PORT → container | yes, DNAT on the host |

**If curl from the host fails:** the web service isn't running or the port isn't published in `docker-compose.yml`.

---

## Task 6. FORWARD (optional)

**Why:** in production the firewall often filters **FORWARD**, not INPUT.

```bash
sudo iptables-nft -L FORWARD -n 2>/dev/null | head -15
```

In Docker, forward between the bridge and containers is usually allowed — the policy is set by the docker daemon.

---

## Task 7. Persist ip_forward (lab only)

```bash
echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-lab-forward.conf
sudo sysctl --system 2>/dev/null | grep ip_forward
```

In the lab container it will reset after recreation anyway — in production sysctl.d is mandatory on router/NAT nodes.

---

## Success criteria

- [ ] You know the value of `ip_forward` on lab and why it's needed
- [ ] You've explained to yourself: internal curl to .20 vs the published port from the host
- [ ] You've seen `docker port` / nat chains or understand why they aren't there inside lab
- [ ] You don't confuse "no internet in the container" with "no connectivity srv1↔lab"

## What to take away

- **Published port** = DNAT on the host; diagnose with `docker port`, `iptables -t nat`, not just `curl` inside the pod network.
- **SNAT** is needed for outbound internet from a private subnet — configured on the gateway, not in every app container.
- **FORWARD** + **conntrack** — the first thing to check for "doesn't cross between VLANs, works within a VLAN".

Next lesson: [07. Firewall](07-firewall.md).
