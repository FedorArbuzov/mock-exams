# 21. rsyslog and log centralization

## Intro: logs in ten files and zero in Loki

On a server, simultaneously:

- **journalctl** — everything the systemd units write;
- `/var/log/nginx/access.log` — web;
- `/var/log/auth.log` — SSH and sudo;
- the application writes to `/opt/app/app.log`, bypassing syslog.

During an incident you lose time if you don't know the **route** of a message: who accepted it, where it was put, how long it's kept.

**rsyslog** is the classic **syslog** routing daemon: filters by facility/priority/programname → file, remote host, discard.

On Ubuntu, **systemd-journald** **duplicates** part of the traffic to syslog (`ForwardToSyslog=yes`) — you see it both in `journalctl` and in `/var/log/syslog`.

## What you'll learn

- The difference between the **journal** vs **files** vs **rsyslog**.
- The structure of `/etc/rsyslog.conf` and `/etc/rsyslog.d/`.
- The "programname → file" rule and why `& stop`.
- Testing via **logger**.
- The concept of **centralized logging** (without opening 514 to the internet).

---

## journal vs rsyslog vs application files

| Source | Where to look | When it's convenient |
|----------|--------------|--------------|
| systemd units | `journalctl -u nginx` | service status, crash |
| classic syslog | `/var/log/syslog` | the general stream |
| auth | `/var/log/auth.log` | SSH, sudo |
| custom by programname | `/var/log/myapp.log` | isolating noise |

```bash
systemctl status rsyslog
ls -la /etc/rsyslog.d/
head -30 /etc/rsyslog.conf
```

**journalctl** stores in a binary journal (usually `/var/log/journal`). **rsyslog** writes text files and can **forward** to a collector.

```bash
journalctl -u ssh -n 5 --no-pager
grep -i ForwardToSyslog /etc/systemd/journald.conf 2>/dev/null
```

---

## Facility and priority (briefly)

A syslog message carries:

- **facility** — the subsystem (auth, daemon, local0…);
- **priority** — severity (debug … emerg).

In rsyslog rules: `auth.*`, `*.info`, `mail.err`.

`logger` lets you set the **programname** tag:

```bash
logger -t myapp -p local0.info "hello from lesson"
```

---

## A local rule (example)

The file `/etc/rsyslog.d/50-myapp.conf`:

```text
if $programname == 'myapp' then /var/log/myapp.log
& stop
```

| Part | Meaning |
|-------|--------|
| `$programname == 'myapp'` | only messages with the `-t myapp` tag |
| `then /var/log/...` | write to a separate file |
| `& stop` | **don't** continue with the rules below (don't duplicate into syslog) |

Applying:

```bash
sudo systemctl restart rsyslog
logger -t myapp "Test from lesson 21"
sleep 1
sudo tail -3 /var/log/myapp.log
sudo tail -3 /var/log/syslog | grep myapp || echo "no duplicate in syslog if stop works"
```

**If the file is empty:** a typo in the name (`myapp` vs `MyApp`), didn't run `restart rsyslog`, no permissions on `/var/log/myapp.log`.

---

## logrotate

Files grow. Packages put configs in `/etc/logrotate.d/`:

```bash
ls /etc/logrotate.d/nginx 2>/dev/null
cat /etc/logrotate.d/rsyslog 2>/dev/null | head -15
```

Without rotation the disk fills up — a separate class of incidents.

---

## Remote logging (theory)

**Receiver** (don't enable it like this in the lab without TLS/VPN):

```text
module(load="imtcp")
input(type="imtcp" port="514")
```

**Sender:**

```text
*.* @@collector.example.com:514
```

`@@` — TCP, `@` — UDP. In prod: TLS, VPN, or an agent (Vector, Fluent Bit) instead of raw 514.

Target systems: **Loki**, ELK, Splunk, CloudWatch — the idea is the same: **central search + retention**.

---

## Connection to DevOps

| Environment | Stream |
|-------|--------|
| VM | app → syslog/journal → rsyslog → file/remote |
| Docker | stdout/stderr → runtime → collector |
| K8s | container log → node agent → Loki/Elastic |

Structured logs (JSON), a **correlation id**, PII masking — on top of the transport.

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| Empty myapp.log | programname, didn't restart |
| Duplicates in syslog | forgot `& stop` |
| Disk full | logrotate, huge debug |
| "No logs" | looking at a file, but only writing to the journal |
| Opened 514 to the internet | spam, leaks |

---

## In production

JSON logging, a retention policy, RBAC access. PII and secrets not in open logs. An alert on the **size growth** of `/var/log` and failed log shipping.

---

## Summary

rsyslog **routes** syslog. **logger -t** — a quick test. The journal — for units. Centralization — a separate pipeline with secure transport.

## Checklist

- [ ] How does the journal differ from `/var/log/syslog`?
- [ ] Why `& stop` in a rule?
- [ ] How do you test a rule with a single command?

Next lesson: [22. Lab: rsyslog](22-lab-rsyslog.md).
