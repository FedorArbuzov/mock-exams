# 12. Lab: cron

## Environment

`docker compose exec lab bash`

---

## Task 1. User crontab

```bash
crontab -l 2>/dev/null || echo "(empty)"
( crontab -l 2>/dev/null; echo "* * * * * date >> /tmp/cron-lab.log" ) | crontab -
```

Wait 2 minutes:

```bash
cat /tmp/cron-lab.log
```

**What you'll see:** several lines with the date.

---

## Task 2. System cron.d

```bash
echo '* * * * * root echo system-cron >> /tmp/cron-system.log' | sudo tee /etc/cron.d/lab-demo
sudo chmod 644 /etc/cron.d/lab-demo
```

After 1–2 minutes:

```bash
cat /tmp/cron-system.log
```

---

## Task 3. cron logs

```bash
grep CRON /var/log/syslog 2>/dev/null | tail -5
journalctl -u cron --no-pager -n 10 2>/dev/null
```

---

## Task 4. Cleanup

```bash
crontab -r
sudo rm -f /etc/cron.d/lab-demo
rm -f /tmp/cron-lab.log /tmp/cron-system.log
```

In prod, set the `* * * * *` interval back to something reasonable — don't leave "every minute" without a need.

---

## Success criteria

- [ ] `/tmp/cron-lab.log` is being appended to
- [ ] `/tmp/cron-system.log` was created via cron.d
- [ ] The crontab was removed after the lab

Next lesson: [13. mount](13-storage-mount.md).
