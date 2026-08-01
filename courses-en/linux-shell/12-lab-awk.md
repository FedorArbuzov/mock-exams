# 12. Lab: a log report with awk

## Lab goal

Build **`/tmp/awk-report.txt`**: disks, ports, error/warn counters from the journal — reinforce **-F**, **NR**, **END**, **printf**.

## Prerequisites

- [11. awk](11-awk.md).
- lab.

```bash
docker compose exec lab bash
```

---

## Task 1. Top UID

```bash
awk -F: '{print $3, $1}' /etc/passwd | sort -n | tail -5
```

---

## Task 2. df — usage > 50%

```bash
df -h | awk 'NR>1 {
  gsub(/%/,"",$5)
  if ($5+0 > 50) print $1, $5"%", $6
}'
```

**If empty:** on lab the disks are often < 50% — that's normal.

---

## Task 3. journal — counters

```bash
journalctl --no-pager -n 2000 2>/dev/null | awk '
tolower($0) ~ /error/  { e++ }
tolower($0) ~ /warn/   { w++ }
END { printf "errors=%d warnings=%d lines scanned\n", e+0, w+0 }
'
```

---

## Task 4. ss — ports (top)

```bash
ss -tlnp 2>/dev/null | awk 'NR>1 {print $4}' | sed 's/.*://' | sort -n | uniq -c | sort -rn | head -10
```

---

## Task 5. Summary report

```bash
{
  echo "# Lab awk report $(date -Iseconds)"
  echo "## Disk (>30% used)"
  df -h | awk 'NR>1 {gsub(/%/,"",$5); if ($5+0>30) printf "%-20s %5s %s\n", $1, $5"%", $6}'
  echo "## Listen ports (sample)"
  ss -tlnp 2>/dev/null | awk 'NR>1 {print $4}' | head -8
  echo "## Journal summary (last 2000 lines)"
  journalctl --no-pager -n 2000 2>/dev/null | awk '
    tolower($0) ~ /error/ { e++ }
    tolower($0) ~ /warn/  { w++ }
    END { printf "errors=%d warnings=%d\n", e+0, w+0 }
  '
} > /tmp/awk-report.txt
cat /tmp/awk-report.txt
wc -l /tmp/awk-report.txt
```

---

## Task 6. passwd in columns (printf)

```bash
awk -F: 'BEGIN {print "USER UID HOME"}
  {printf "%-12s %6s %s\n", $1, $3, $6}' /etc/passwd | head -8
```

---

## Success criteria

- [ ] `/tmp/awk-report.txt` created, ≥ 10 lines
- [ ] journal awk printed errors/warnings
- [ ] -F, NR, END, gsub are used
- [ ] You understand `$5+0` for numbers

## What to take into your work

- log-report.sh in the final — the same END pattern.
- Always check the field against a **single** log line.

Next lesson: [13. shellcheck](13-shellcheck.md).
