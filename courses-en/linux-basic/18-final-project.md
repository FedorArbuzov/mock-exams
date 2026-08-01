# 18. Final project: a mini-server on srv1

## Why this project

Until now the topics went separately: users, permissions, systemd, ssh. In prod everything is **connected**: deploy logs in with a key, restarts a unit, cron writes a backup, nginx serves static files. Here you'll assemble the same **small** slice on **srv1** (172.28.0.11) and verify it from **lab** (172.28.0.10).

Don't chase perfect security — this is a training environment. But get used to order: keys, a separate user, minimal sudo, logs.

## What you should end up with

| # | Requirement | Why |
|---|------------|--------|
| 1 | The **deploy** user, home, shell `/bin/bash` | not working as course/root |
| 2 | **deploy** in sudo (for the lab, NOPASSWD on specific commands is fine) | admin actions done deliberately |
| 3 | SSH from lab to deploy **by key** | as in CI and a jump host |
| 4 | The **lab-app.service** unit — writes a marker to `/var/log/lab-app.log` | systemd |
| 5 | Cron: hourly archive of `/etc/nginx` into `/backup` | automation |
| 6 | The `/backup` directory exists | a place for archives |
| 7 | **nginx** responds at `http://172.28.0.11` | network + service check |

## Step-by-step plan (recommended order)

### 1. Connect to srv1

From lab:

```bash
ssh course@172.28.0.11
# password: course
```

From here, commands are prefixed with "on srv1" unless stated otherwise.

### 2. The deploy user

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
```

For a quick cron check you can temporarily grant full sudo; in intermediate you'll set up a targeted sudoers.

### 3. Key from lab

On **lab** (not on srv1):

```bash
test -f ~/.ssh/id_lab.pub || ssh-keygen -t ed25519 -f ~/.ssh/id_lab -N "" -C "lab-to-srv1"
ssh-copy-id -i ~/.ssh/id_lab.pub deploy@172.28.0.11
ssh -i ~/.ssh/id_lab deploy@172.28.0.11 hostname
```

It should log in **without a password**.

### 4. lab-app.service

Create a script, for example `/usr/local/bin/lab-app.sh`:

```bash
#!/bin/bash
echo "$(date -Is) lab-app ran" >> /var/log/lab-app.log
```

```bash
sudo chmod +x /usr/local/bin/lab-app.sh
```

A unit in `/etc/systemd/system/lab-app.service` (oneshot or simple with `RemainAfterExit=yes` — as in [10-lab-systemd](10-lab-systemd.md)):

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lab-app.service
sudo systemctl status lab-app --no-pager
```

### 5. nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
curl -s http://127.0.0.1/ | head
```

### 6. Cron and backup

```bash
sudo mkdir -p /backup
echo '0 * * * * root tar czf /backup/etc-nginx-$(date +\%F).tar.gz /etc/nginx 2>/dev/null' | sudo tee /etc/cron.d/lab-backup-nginx
```

For a quick check you can **temporarily** use `* * * * *`, wait for a file in `/backup`, then set `0 * * * *` back.

### 7. A README for yourself (optional)

```bash
echo "deploy, lab-app, nginx, hourly nginx backup" | sudo tee /home/deploy/README.txt
sudo chown deploy:deploy /home/deploy/README.txt
```

## Verification from lab — submission checklist

```bash
ssh -i ~/.ssh/id_lab deploy@172.28.0.11 'hostname; id'
curl -s -o /dev/null -w "%{http_code}\n" http://172.28.0.11/
ssh -i ~/.ssh/id_lab deploy@172.28.0.11 'ls -la /backup; sudo systemctl status lab-app --no-pager; tail -1 /var/log/lab-app.log'
```

You expect: HTTP **200**, a `.tar.gz` file in `/backup` (or after the test cron), a line in lab-app.log.

## If something doesn't work

| Symptom | Where to look |
|---------|----------------|
| SSH asks for a password | permissions of `~deploy/.ssh`, `authorized_keys` 600 |
| curl timeout | nginx not listening, firewall (rare in the environment so far) |
| empty /backup | cron, the path to tar, whether `/etc/nginx` exists |
| lab-app failed | `journalctl -u lab-app -n 30` |

## Further along the DevOps path

- [linux-intermediate](../linux-intermediate/README.md) — DNS, firewall, TLS, Postfix
- [gitlab-basic](../gitlab-basic/README.md) — CI (can be done in parallel)
- [linux-security](../linux-security/README.md) — ssh hardening and auditing
- [bare-metal](../bare-metal/README.md) — hardware and PXE

Congratulations on finishing the basic track — next up is networking and services "like in prod", but still in the same Docker environment.
