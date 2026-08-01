# 15. Lab: path diagnostics on deploy/linux

## Goal

Practice the method from [chapter 13](13-troubleshooting.md): L3 → L4 → L7 → policy on the [`deploy/linux`](../../deploy/linux/README.md) sandbox. Time: **60–90 minutes**.

## Prerequisites

- Completed [linux-intermediate/11–12](../linux-intermediate/11-network-debug.md)
- The sandbox is running:

```bash
cd deploy/linux
docker compose up -d
docker compose exec lab ping -c1 172.28.0.11
```

## Scenarios

An instructor (or you yourself) **breaks** the configuration on `srv1` (`172.28.0.11`). Your task is to find the layer and fix it. Record the **commands and output** in your notes.

### Scenario A — "Connection refused"

**Symptom** from `lab`:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://172.28.0.11/ || true
```

Expected behavior after the fix: HTTP `200`.

**Hints for breaking it** (if you're practicing on srv1 yourself):

```bash
docker compose exec srv1 bash
# nginx listens on localhost only
sed -i 's/listen 80;/listen 127.0.0.1:80;/' /etc/nginx/sites-enabled/default
systemctl reload nginx
```

**Diagnostics:**

```bash
ip route get 172.28.0.11
nc -zv 172.28.0.11 80
docker compose exec srv1 ss -tlnp | grep ':80'
```

**Layer:** L4 bind.

---

### Scenario B — "Connection timed out"

**Break it** (on srv1, root):

```bash
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0 \; policy accept \; }
nft add rule inet filter input ip saddr 172.28.0.10 tcp dport 80 drop
```

**Diagnostics:**

```bash
curl -v --connect-timeout 3 http://172.28.0.11/
docker compose exec srv1 nft list ruleset
docker compose exec srv1 tcpdump -i eth0 -nn host 172.28.0.10 and port 80 -c 5
```

**Layer:** policy (host firewall). Do **not** fix it by opening everything — use a targeted rule or delete the rule.

---

### Scenario C — "Works by IP, not by name"

**Break it:** break DNS on `lab` or the response for `app.lab.local`.

```bash
# on lab — temporarily a wrong resolver in /etc/resolv.conf (save a backup)
docker compose exec lab bash -c 'cp /etc/resolv.conf /tmp/resolv.bak; echo nameserver 127.0.0.1 > /etc/resolv.conf'
```

**Verification:**

```bash
dig @172.28.0.53 app.lab.local +short
curl -v http://app.lab.local/
curl -v http://172.28.0.20/
```

**Layer:** L7 DNS (not L3 to the web).

---

### Scenario D — "Route goes the wrong way" (optional)

Add a bogus route on `lab`:

```bash
docker compose exec lab ip route add 172.28.0.11/32 via 172.28.0.99
```

```bash
ip route get 172.28.0.11
ping -c1 172.28.0.11
```

**Layer:** L3. Remove the route afterward:

```bash
docker compose exec lab ip route del 172.28.0.11/32 via 172.28.0.99
```

---

## Report (deliverable)

One page per scenario:

| Field | Value |
|------|----------|
| Symptom | refused / timeout / DNS |
| Layer | L3 / L4 / L7 / policy |
| Evidence command | e.g. `ss`, `nft`, `dig` |
| Fix | what you changed |
| Time to root cause | min |

---

## Resetting the sandbox

```bash
cd deploy/linux
docker compose restart srv1 lab
# or a full reset:
docker compose down -v && docker compose up -d
```

---

## Checklist

- [ ] You didn't jump straight to tcpdump without `ip route get` and `ss`.
- [ ] You distinguished refused from timeout on live examples.
- [ ] You restored the sandbox after the experiments.

**Next:** [16. Synthesis](16-synthesis.md).
