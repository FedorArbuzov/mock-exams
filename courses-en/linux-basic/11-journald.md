# 11. journalctl and the systemd journal

## Why the journal if there's /var/log

Previously each daemon wrote to its own file, with different formats and its own rotation. **systemd-journald** collects kernel messages, services' stdout/stderr, and syslog into **one** binary journal with metadata: unit, PID, priority, boot id.

On modern Ubuntu you almost always start with:

```bash
journalctl -u nginx -n 50 --no-pager
```

Files in `/var/log/nginx/` may duplicate the same content — but when a "service won't start", the journal shows the process's stderr right after `systemctl start`.

## Where the journal lives

- Persistent: `/var/log/journal/` (if storage is enabled)
- Volatile: `/run/log/journal/` (gone after reboot)

Size:

```bash
journalctl --disk-usage
```

## journalctl — cheat sheet

```bash
journalctl -xe              # latest errors, hints
journalctl -f               # follow
journalctl -u ssh
journalctl -u nginx --since "1 hour ago"
journalctl -p err -b
journalctl -b -1            # previous boot
journalctl -n 100 --no-pager
```

| Flag | Effect |
|------|--------|
| `-u UNIT` | logs of a unit (`.service` can be omitted) |
| `-f` | like `tail -f` |
| `-b` | current boot |
| `--since` / `--until` | time window |
| `-p warning` | from warning and "worse" |
| `--no-pager` | straight to stdout (scripts, CI) |

## Priorities

| Name | Number | When |
|-----|-------|--------|
| emerg … err | 0–3 | fire |
| warning, notice | 4–5 | degradation |
| info, debug | 6–7 | noise |

In prod, when hunting for an incident: `-p err` or `-p warning`.

## Classic logs — haven't disappeared

```bash
ls -la /var/log/
tail -20 /var/log/auth.log
tail -20 /var/log/nginx/error.log
```

rsyslog/nginx/apache often **duplicate**. In intermediate you'll set up centralization ([rsyslog](../linux-intermediate/21-rsyslog.md)).

## Limit journal growth

`/etc/systemd/journald.conf`:

```ini
[Journal]
SystemMaxUse=500M
RuntimeMaxUse=100M
```

```bash
sudo systemctl restart systemd-journald
```

Otherwise a full disk due to the journal is a common surprise on small VMs.

## Checklist

- How do you view the ssh logs for the last hour?
- How does `-f` differ from a one-off output?
- Where do you check how much space the journal has eaten?

Next lesson: [11. Lab: journal](11-lab-journal.md).
