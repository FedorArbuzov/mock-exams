# 12. cron, at, systemd timers

## Why a scheduler on a server

Backups, log rotation, reports, cleaning `/tmp` — all of this is **on a schedule**. Linux has three common mechanisms: **cron** (the classic), **at** ("once, later"), **systemd timer** (integration with a unit, dependencies, jitter).

In the basic final project you'll already put a cron on srv1; in intermediate you'll compare it with a timer for the same tasks.

## cron — five fields and a command

```bash
crontab -l
crontab -e
sudo crontab -u root -l
```

Format:

```text
# min  hour day_of_month month day_of_week command
*/5  *    *         *       *         /usr/local/bin/check.sh
```

| Field | Range |
|------|----------|
| minute | 0–59 |
| hour | 0–23 |
| day of month | 1–31 |
| month | 1–12 |
| day of week | 0–7 (0 and 7 = Sunday) |

Examples:

```text
0 2 * * *       daily at 02:00
0 */6 * * *     every 6 hours
30 4 * * 1      Monday 04:30
```

System files: `/etc/crontab`, `/etc/cron.d/*`, `/etc/cron.{hourly,daily,...}/`.

**Important:** in crontab there's a **minimal environment** — no `.bashrc` of yours. Write full paths (`/usr/bin/tar`) and, if needed, `PATH=` at the top of the file.

Logs:

```bash
grep CRON /var/log/syslog 2>/dev/null
journalctl -u cron --no-pager -n 20
```

## at — one-off

```bash
echo "echo done > /tmp/at-demo" | at now + 5 minutes
atq
atrm 1    # number from atq
```

Handy to defer a heavy task "for the night" without editing crontab.

## systemd timers

```bash
systemctl list-timers --all | head
systemctl status apt-daily.timer
```

A timer activates a **service** unit. Pros: `OnCalendar`, `RandomizedDelaySec` (not all jobs at 00:00), dependencies `After=network-online.target`, logs in the journal.

## What to choose

| Scenario | Tool |
|----------|------------|
| A simple shell script once a night | cron |
| "Run once in an hour" | at |
| A task next to a systemd service | timer |

## Checklist

- Decode `0 */6 * * *`
- Why does a cron script "not find python"?
- Where is the crontab of the user course?

Next lesson: [12. Lab: cron](12-lab-cron.md).
