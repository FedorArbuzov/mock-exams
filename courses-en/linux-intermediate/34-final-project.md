# 34. Intermediate final project

## Intro: assembling a "minimal prod" in Docker

Separately, you know how to use ping, dig, ufw, nginx, and cron. The **finale** is one coherent loop: from **lab** you SSH into **srv1**, HTTP goes through a firewall, from **lab** there's a reverse proxy on :8080, the configs are **backed up**, and the logs aren't screaming about errors. This is what a small production VM without Kubernetes looks like — and it's the deliberate goal of the intermediate course.

## What you'll learn (course wrap-up)

- Assemble the stack from lessons 01–33 into one runbook.
- Check yourself with a script and a checklist.
- Put together a brief report for "submission" or a portfolio.

## Environment architecture

```mermaid
flowchart TB
  subgraph lab_host [lab 172.28.0.10]
    Proxy[nginx :8080]
  end
  subgraph srv1_host [srv1 172.28.0.11]
    UFW[ufw 22 80]
    Nginx[nginx :80]
    Cron[cron tar backup]
    Backup[/backup]
  end
  User[You on lab] --> Proxy
  Proxy -->|proxy_pass| Nginx
  User -->|SSH HTTP| srv1_host
  Cron --> Backup
  UFW --> Nginx
```

Optional: **web** (.20) with TLS, **NFS** instead of tar, a Postgres health check with [`deploy/postgres`](../../deploy/postgres/README.md).

## Requirements

| # | Component | Where | Criterion |
|---|-----------|-----|----------|
| 1 | ufw | srv1 | active; 22, 80; SSH from lab |
| 2 | nginx | srv1 | HTTP 200 on / |
| 3 | reverse proxy | lab | :8080 → srv1 |
| 4 | backup | srv1 | `/backup/*.tar.gz` or an NFS mount |
| 5 | logs | srv1/lab | no critical nginx/ssh errors |
| 6 | (opt.) TLS | web | curl -k https://172.28.0.20 |
| 7 | (opt.) Postgres | lab | curl health deploy/postgres |

## Runbook — recommended order

### Phase 1: srv1 — the base

```bash
ssh course@172.28.0.11
sudo apt update
sudo apt install -y nginx ufw
sudo systemctl enable --now nginx
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

### Phase 2: ufw (two SSH sessions!)

See [08-lab-firewall](08-lab-firewall.md):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow from 172.28.0.0/24 to any port 22 proto tcp
sudo ufw enable
```

From lab: `ssh course@172.28.0.11 true` and `curl http://172.28.0.11/`.

### Phase 3: backup

```bash
sudo mkdir -p /backup
echo '0 * * * * root tar czf /backup/etc-nginx-$(date +\%F).tar.gz /etc/nginx 2>/dev/null' | sudo tee /etc/cron.d/lab-backup-nginx
```

For a quick check, temporarily use `* * * * *`, wait for the file, then restore `0 * * * *`.

### Phase 4: proxy on lab

```bash
# on lab
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/lab-proxy <<'EOF'
server {
    listen 8080;
    location / {
        proxy_pass http://172.28.0.11;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/lab-proxy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

### Phase 5: deploy user (optional, but useful)

Per [linux-basic/18](../linux-basic/18-final-project.md): the **deploy** user, an SSH key, [24-lab-sudo](24-lab-sudo.md) for nginx.

### Phase 6: report

On lab:

```bash
cat > ~/intermediate-done.txt <<EOF
Intermediate final — $(date -Is)
srv1: ufw + nginx + /backup
lab: proxy :8080 -> 172.28.0.11
Checks: see below
EOF
```

## Verification script (from lab)

```bash
echo "=== intermediate final checks ==="
curl -s -o /dev/null -w "srv1 direct: %{http_code}\n" http://172.28.0.11/
curl -s -o /dev/null -w "lab proxy:   %{http_code}\n" http://127.0.0.1:8080/
ssh -o ConnectTimeout=5 course@172.28.0.11 'sudo ufw status | head -3; ls /backup 2>/dev/null | head -3'
journalctl -u nginx --no-pager -p err -n 3 2>/dev/null || true
cat ~/intermediate-done.txt 2>/dev/null
```

Expected: **200**, **200**, ufw active, at least one `.tar.gz` in `/backup`.

## Submission criteria

- [ ] HTTP 200 on srv1 from lab
- [ ] ufw active, SSH not lost
- [ ] proxy :8080 → 200
- [ ] `/backup` contains an nginx archive (or NFS is mounted)
- [ ] `~/intermediate-done.txt` is filled in
- [ ] You can explain out loud the packet's path: lab → proxy → srv1

## If you're stuck

| Problem | Chapter |
|----------|--------|
| SSH timeout | [07](07-firewall.md), [08](08-lab-firewall.md) |
| 502 proxy | [13](13-nginx.md), [14](14-lab-nginx.md) |
| empty /backup | [cron in linux-basic](../linux-basic/12-scheduling.md) |
| DNS names | [03](03-dns.md) |

Full reset: `docker compose down -v && docker compose up -d` in `deploy/linux`.

## Further along the DevOps path

- [linux-advanced](../linux-advanced/README.md) — namespaces, cgroups, preparing a node
- [linux-security](../linux-security/README.md) — hardening, audit
- [kuber-basic](../kuber-basic/README.md) — orchestration on top of these skills
- [gitlab-basic](../gitlab-basic/README.md) — CI for deploying to hosts like these

Congratulations on completing **linux-intermediate** — you've traveled the path from TCP/IP to a mini-stack with a firewall, web, and backup on a real (albeit Docker) Linux.
