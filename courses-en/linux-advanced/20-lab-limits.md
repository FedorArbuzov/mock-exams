# 20. Lab: LimitNOFILE for nginx

## Lab goal

Raise **LimitNOFILE** for nginx via a **systemd drop-in**, verify it via `systemctl show` and `/proc/PID/limits` — a pattern for any high-connection daemon.

## Prerequisites

- [19. sysctl and limits](19-sysctl-limits.md).
- srv1 or lab with nginx.

```bash
ssh course@172.28.0.11
sudo apt install -y nginx
```

---

## Task 1. Current limits

```bash
ulimit -n
NGINX_PID=$(pgrep -o nginx)
echo "PID=$NGINX_PID"
sudo cat /proc/$NGINX_PID/limits | grep "open files"
systemctl show nginx -p LimitNOFILE --value 2>/dev/null
```

Record it **before** the changes.

---

## Task 2. systemd drop-in

```bash
sudo mkdir -p /etc/systemd/system/nginx.service.d
sudo tee /etc/systemd/system/nginx.service.d/limits.conf <<'EOF'
[Service]
LimitNOFILE=8192
LimitNPROC=4096
EOF
sudo systemctl daemon-reload
sudo systemctl restart nginx
systemctl is-active nginx
```

---

## Task 3. Verification

```bash
systemctl show nginx -p LimitNOFILE --value
systemctl show nginx -p LimitNPROC --value
NGINX_PID=$(pgrep -o nginx)
sudo cat /proc/$NGINX_PID/limits | grep -E "open files|max processes"
```

**What you'll see:** Max open files **8192** (soft/hard).

---

## Task 4. limits.conf (comparison)

```bash
grep -rh nginx /etc/security/limits.conf /etc/security/limits.d/ 2>/dev/null || echo "no nginx entry in limits.conf"
```

**Conclusion:** for **daemons** — systemd, not just limits.conf.

---

## Task 5. sysctl somaxconn (optional)

```bash
sysctl net.core.somaxconn
echo 'net.core.somaxconn = 4096' | sudo tee /etc/sysctl.d/99-nginx-lab.conf
sudo sysctl -p /etc/sysctl.d/99-nginx-lab.conf
```

Align it with the `listen backlog` in nginx — a separate tuning topic.

---

## Success criteria

- [ ] LimitNOFILE=8192 in systemctl show
- [ ] /proc/PID/limits shows 8192
- [ ] nginx active after restart
- [ ] You understand the difference between ulimit and systemd

## What to take to work

- "Too many open files" → systemd drop-in + file-max + leak check.
- In an Ansible playbook: the `systemd` module + a drop-in template.

Next lesson: [21. eBPF intro](21-ebpf-intro.md).
