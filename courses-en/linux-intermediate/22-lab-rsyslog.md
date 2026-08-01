# 22. Lab: rsyslog

## Lab goal

Create a **programname → separate file** rule, verify delivery via **logger**, see the entry in the **journal**, and deliberately remove the rule. This is the same pattern as "isolate the logs of your own daemon" on staging.

## Prerequisites

- [21. rsyslog](21-rsyslog.md).
- lab, sudo.

```bash
docker compose exec lab bash
systemctl is-active rsyslog
sudo apt install -y rsyslog 2>/dev/null
```

---

## Preparing the stand

```bash
systemctl status rsyslog --no-pager | head -8
ls -la /var/log/syslog /var/log/auth.log 2>/dev/null | head -3
ls /etc/rsyslog.d/
```

**If rsyslog is inactive:** `sudo systemctl enable --now rsyslog`.

---

## Task 1. Initial state

**Why:** to confirm that syslog is being written at all.

```bash
logger "baseline before myapp rule"
sudo tail -2 /var/log/syslog
```

Write down the time of the last line.

---

## Task 2. The myapp rule

**Why:** to isolate the "application's" logs from the general syslog.

```bash
sudo tee /etc/rsyslog.d/50-myapp.conf <<'EOF'
if $programname == "myapp" then /var/log/myapp.log
& stop
EOF
sudo systemctl restart rsyslog
systemctl is-active rsyslog
```

**Syntax check (if available):**

```bash
sudo rsyslogd -N1 2>&1 | tail -5
```

**If restart failed:** `journalctl -u rsyslog -n 20` — often a typo in the conf.

---

## Task 3. The first entry

```bash
logger -t myapp "rsyslog lab message one"
sleep 1
sudo cat /var/log/myapp.log
```

**What you'll see:** a line with `rsyslog lab message one`, the hostname, a timestamp.

**If the file wasn't created:**

```bash
ls -la /var/log/myapp.log
sudo tail -5 /var/log/syslog | grep myapp
```

- present in syslog, no file → a `programname` typo or the rule wasn't picked up;
- nowhere → logger didn't reach rsyslog.

---

## Task 4. journal

```bash
journalctl -t myapp --no-pager -n 8
```

The message may be in the journal **too** — that's normal (journald sees it before or in parallel with rsyslog).

---

## Task 5. A second message and a counter

```bash
logger -t myapp "message two"
logger -t myapp -p local0.warning "warning level test"
sudo wc -l /var/log/myapp.log
sudo tail -5 /var/log/myapp.log
```

**Why:** to confirm the rule works consistently.

---

## Task 6. No duplicate in syslog (checking & stop)

```bash
logger -t myapp "duplicate check"
sudo grep myapp /var/log/syslog | tail -3
```

**Expectation:** after configuring `& stop`, new lines should **not** appear in syslog (old ones may remain from before the rule).

If there are duplicates — reread the [theory](21-rsyslog.md) on `& stop`.

---

## Task 7. A different programname

```bash
logger -t otherapp "should not go to myapp.log"
sudo tail -1 /var/log/myapp.log
```

**Expectation:** myapp.log has only its own messages.

---

## Cleanup

```bash
sudo rm -f /etc/rsyslog.d/50-myapp.conf /var/log/myapp.log
sudo systemctl restart rsyslog
ls /var/log/myapp.log 2>&1
```

---

## Success criteria

- [ ] `/var/log/myapp.log` is created and contains the test lines
- [ ] `journalctl -t myapp` sees the events
- [ ] You understand the role of `& stop`
- [ ] Cleanup: conf and file removed, rsyslog active

## What to take away

- A new daemon without its own file — add an rsyslog rule + logrotate.
- Before remote logging — first a stable local file.
- The "no logs" incident — journal vs file vs programname.

Next lesson: [23. sudo](23-sudo.md).
