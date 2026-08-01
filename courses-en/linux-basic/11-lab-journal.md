# 11. Lab: journalctl

## Environment

`docker compose exec lab bash`

---

## Task 1. General overview

```bash
journalctl --disk-usage
journalctl -n 20 --no-pager
journalctl -p warning -b --no-pager | tail -15
```

---

## Task 2. The ssh unit (or cron)

```bash
journalctl -u ssh --no-pager -n 30
```

If empty — use `systemd-journald` or the `lab-hello` unit from the previous lab.

---

## Task 3. Time window

```bash
journalctl --since "10 min ago" --no-pager | tail -20
```

---

## Task 4. Follow (5 seconds)

In one terminal:

```bash
journalctl -f
```

In another (or after Ctrl+C) generate an event:

```bash
logger "linux-basic journal lab test"
```

**What you'll see:** a line with your message.

---

## Task 5. Comparison with a file

```bash
ls -la /var/log/syslog 2>/dev/null || ls -la /var/log/
```

---

## Success criteria

- [ ] `journalctl --disk-usage` ran
- [ ] A filter by unit or priority showed lines
- [ ] `logger` is visible in the journal

Next lesson: [12. cron](12-scheduling.md).
