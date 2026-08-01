# 06. grep, cut, sort, uniq, awk

## Why a whole lesson about "text" utilities

Logs are text. Metrics in the CLI are tables. `/etc/passwd` is columns split by `:`. A DevOps engineer does **not** read gigabytes by eye: they cut, filter, and count. The same techniques work on a jump host, in `kubectl logs`, in a CI job.

Advanced awk/sed — [`linux-shell`](../linux-shell/README.md). Here — the working minimum for everyday use.

## grep — find lines by pattern

```bash
grep "error" /var/log/syslog 2>/dev/null
grep -i failed /var/log/auth.log 2>/dev/null
grep -rn "server_name" /etc/nginx/ 2>/dev/null
grep -c "^#" /etc/ssh/sshd_config
grep -E "ssh|sudo" /var/log/auth.log 2>/dev/null | tail
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
```

| Flag | Effect |
|------|--------|
| `-i` | case-insensitive |
| `-r` | recursively over a directory |
| `-n` | line number |
| `-c` | count of matches only |
| `-v` | invert — lines **without** the pattern |
| `-E` | extended regex (`|`, `+`, `?`) |
| `-F` | fixed string (not regex) |

**Tip:** in logs, `tail -100` first, then `grep`, otherwise you'll flood the terminal.

## cut — extract columns

```bash
cut -d: -f1 /etc/passwd | head
cut -d: -f1,6 /etc/passwd | head
df -h | tr -s ' ' | cut -d' ' -f1,5
```

`-d` — delimiter, `-f` — field numbers. For whitespace-separated tables, `tr -s ' '` often collapses the spaces first.

## sort and uniq — frequencies and top lists

```bash
cut -d: -f1 /etc/passwd | sort | uniq -c | sort -rn | head
```

`uniq` removes only **consecutive** duplicates. Without `sort` before `uniq` the result will be wrong — a classic trap.

## wc — quick counting

```bash
wc -l /etc/passwd
journalctl --no-pager -u ssh 2>/dev/null | wc -l
```

## awk — when cut isn't enough

```bash
awk -F: '{print $1, $3, $6}' /etc/passwd | head
awk '/error|fail/i {print $0}' /var/log/syslog 2>/dev/null | tail
awk '{sum+=$1} END {print "total:", sum}' numbers.txt
```

`-F:` — the field separator. `$1`, `$2`, … `$NF` — the last field. The `END` block runs after all lines — handy for sums.

## Typical incident pipelines

```bash
# failed SSH
journalctl -u ssh --no-pager 2>/dev/null | grep -i "Failed password" | tail -20

# top IPs in access.log (if nginx is present)
awk '{print $1}' /var/log/nginx/access.log 2>/dev/null | sort | uniq -c | sort -rn | head

# active ssh config without comments
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
```

## Beginner mistakes

- `grep pattern` without a file — it waits for stdin; in a script the pipe gets forgotten.
- Regex with parentheses without `-E` — "finds nothing".
- `uniq` without `sort` — "too many uniques".

## Checklist

- Why do you almost always need `sort` before `uniq`?
- How do you print only the non-empty, non-comment lines from a config?
- How, with awk, do you print login and home from `/etc/passwd`?

Next lesson: [06. Lab: logs](06-lab-grep.md).
