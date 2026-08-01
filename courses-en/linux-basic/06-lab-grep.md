# 06. Lab: grep, awk, log analysis

You will work through **real** sources on the server: sshd_config, the journal, and nginx if present. The goal is to build a "filter → counter → top" pipeline.

## Environment

`docker compose exec lab bash`

---

## Task 1. grep in a config

```bash
grep -n "^PermitRootLogin" /etc/ssh/sshd_config
grep -E "^#|^$" /etc/ssh/sshd_config | wc -l
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$" | head -15
```

**What you'll see:** commented lines with `#` at the start; a "clean" config without blank lines.

---

## Task 2. cut and sort

```bash
cut -d: -f1,3 /etc/passwd | head -5
cut -d: -f1 /etc/passwd | sort | tail -5
```

---

## Task 3. journal + grep

```bash
journalctl --no-pager -n 50 | grep -i error | tail -10
journalctl -u ssh --no-pager -n 30 2>/dev/null | grep -i fail | tail -5
```

If the ssh unit is empty — that's normal in a quiet container; the point is the syntax.

---

## Task 4. awk over passwd

```bash
awk -F: '$3 >= 1000 {print $1, $3, $6}' /etc/passwd
```

**What you'll see:** users with UID ≥ 1000 (regular accounts on Ubuntu).

---

## Task 5. uniq and top (synthetic)

Create a training "log":

```bash
cat > /tmp/access-fake.log <<'EOF'
10.0.0.1 GET /
10.0.0.2 GET /
10.0.0.1 GET /api
10.0.0.3 GET /
10.0.0.1 GET /
10.0.0.2 GET /
EOF
awk '{print $1}' /tmp/access-fake.log | sort | uniq -c | sort -rn
```

**What you'll see:** `10.0.0.1` more often than the rest — this is how you spot a DDoS or a broken client.

---

## Task 6. (Optional) nginx

```bash
sudo apt install -y nginx 2>/dev/null
curl -s -o /dev/null http://127.0.0.1/
grep -c "" /var/log/nginx/access.log 2>/dev/null
```

---

## Success criteria

- [ ] A "cleaned" fragment of sshd_config without comments was obtained
- [ ] awk printed users with UID ≥ 1000
- [ ] The top IPs from fake.log were built via sort | uniq -c

Next lesson: [07. vim](07-vim.md).
