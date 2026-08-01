# 19. sysctl and limits.conf

## Intro: "Too many open files" at 500 RPS

Nginx in the logs: `24: Too many open files`. `ulimit -n` in the shell is 1024, in the nginx unit it's the default 1024, but there are thousands of connections. Two mechanisms: **sysctl** (**kernel** parameters) and **limits** (per-user/process).

Confusion between **limits.conf** and **systemd LimitNOFILE** is a common cause of "we raised ulimit, the service still shows 1024".

## What you'll learn

- **sysctl** runtime and `/etc/sysctl.d/`.
- **limits.conf** and the PAM session.
- **systemd** `LimitNOFILE`, `LimitNPROC`.
- What to check during an incident.

---

## sysctl — kernel parameters

```bash
sysctl net.ipv4.ip_forward
sysctl net.core.somaxconn
sudo sysctl -w net.core.somaxconn=4096
```

Persist:

```bash
echo 'net.core.somaxconn = 4096' | sudo tee /etc/sysctl.d/99-app.conf
sudo sysctl --system
```

| Parameter | Meaning |
|----------|--------|
| `net.core.somaxconn` | listen backlog queue |
| `net.ipv4.ip_local_port_range` | ephemeral ports |
| `fs.file-max` | global limit of open files in the kernel |
| `vm.swappiness` | tendency to swap |

Related to [K8s node prep](07-k8s-node-prep.md) and [linux-intermediate performance](../linux-intermediate/29-performance.md).

---

## limits.conf

`/etc/security/limits.conf`:

```text
nginx soft nofile 65535
nginx hard nofile 65535
*    soft    nproc   4096
*    hard    nproc   4096
```

Check an **interactive** session:

```bash
ulimit -n
ulimit -u
```

**Important:** for **systemd services** limits.conf may **not** apply — use a drop-in unit.

---

## systemd overrides (preferred for services)

```ini
# /etc/systemd/system/nginx.service.d/limits.conf
[Service]
LimitNOFILE=65535
LimitNPROC=4096
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart nginx
systemctl show nginx -p LimitNOFILE --value
cat /proc/$(pgrep -o nginx)/limits | grep "open files"
```

| Source | For whom |
|----------|------|
| limits.conf + PAM | login ssh, su |
| systemd unit | daemons |

---

## Diagnostics

```bash
cat /proc/PID/limits
grep "open files" /proc/PID/limits
ls /proc/PID/fd | wc -l
```

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| ulimit high, nginx 1024 | no systemd drop-in |
| somaxconn low | sysctl |
| file-max exhausted | kernel, leak |
| * soft nofile in limits | not for all services |

---

## In production

A single baseline in Ansible: `sysctl.d` + `systemd` drop-ins. Document the application's requirements (Elasticsearch, Kafka — huge nofile).

---

## Summary

**sysctl** — kernel, **/etc/sysctl.d/**. Services — **LimitNOFILE** in systemd. **ulimit** in the shell — not proof for nginx.

## Checklist

- [ ] Where do you persist sysctl?
- [ ] How does ulimit differ from LimitNOFILE?
- [ ] How do you check the **process** limit of nginx?

Next lesson: [20. Lab: limits](20-lab-limits.md).
