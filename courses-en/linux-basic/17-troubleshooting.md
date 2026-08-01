# 17. Troubleshooting: load, disk, permissions, network

## The method that doesn't let you down

Panic → reboot → "it fixed itself" leaves you without understanding. The working order:

1. **Symptom** — what exactly is wrong (HTTP 502, SSH timeout, disk full).
2. **Boundary** — one host, one service, or the whole network.
3. **Changes** — a deploy, a config, a patch, cron (ask "what changed?").
4. **Logs** — journal + application files **with a timestamp**.
5. **Resources** — CPU, RAM, disk, FD, connections.
6. **Hypothesis → check** — one change, one test.

Document command output in the ticket — in a week you'll thank yourself.

## CPU and load

```bash
uptime
top -b -n 1 | head -20
ps aux --sort=-%cpu | head -10
```

**Load average** (1/5/15 min) — how many processes are waiting for CPU or I/O. Load 20 with an idle CPU often = **disk**, not "you need 20 cores".

## Memory and OOM

```bash
free -h
ps aux --sort=-%mem | head
dmesg -T | grep -i oom
journalctl -k | grep -i oom
```

The OOM killer kills a process without asking — the kernel logs will contain the victim's name.

## Disk: bytes and inodes

```bash
df -h
df -i
du -xhd1 /var | sort -h | tail -15
```

"No space left on device" while "there's space" — check the **inodes** (`df -i`). The classic — millions of small files in `/tmp` or sessions.

## Permissions and path

```bash
namei -l /var/lib/nginx/proxy/cache/some/file
ls -la /var/lib/nginx
```

"Permission denied" — owner, group, missing `x` on directories in the path, later SELinux/AppArmor.

## Network — distinguish the failures

```bash
ss -tlnp
ping -c2 HOST
curl -v --connect-timeout 3 http://HOST/
traceroute HOST
```

| Message | Common cause |
|-----------|----------------|
| Connection refused | port closed, service not listening |
| Connection timed out | firewall, route, host down |
| HTTP 502/504 | upstream, not "the network to the client" |

## Services

```bash
systemctl status nginx
journalctl -u nginx -n 80 --no-pager
nginx -t
```

A config with a syntax error — the service won't come up; `nginx -t` is faster than guessing.

## Incident checklist

- [ ] Does it reproduce reliably?
- [ ] Are there logs in the time window?
- [ ] Are `df -h` and `df -i` OK?
- [ ] Is the port listening (`ss -tlnp`)?
- [ ] Is the last change recorded?

Next lesson: [17. Lab: diagnostics](17-lab-troubleshooting.md) → then the [final project](18-final-project.md).
