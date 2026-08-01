# 11. awk — reports and field parsing

## Intro: "count the errors in the log over an hour"

`grep error log | wc -l` won't show the **top IPs** and won't group by a field. **awk** — the standard for tabular text: `/etc/passwd`, `df -h`, `ss`, journalctl, access.log.

An awk one-liner is often shorter and faster than a bash `while read` loop.

## What you'll learn

- The model: a **record** (a line), **fields** `$1`, `$2`…
- The **`-F`** separator, **`NR`**, **`NF`**, **`$0`**, **`$NF`**.
- Conditions and the **BEGIN** / **END** blocks.
- **`printf`** for columns.
- When **jq** is better than awk.

---

## Basic field output

```bash
awk '{print $1, $3}' /etc/passwd | head
awk -F: '{print "user=" $1, "uid=" $3, "home=" $6}' /etc/passwd | head
```

| Variable | Meaning |
|------------|----------|
| `$0` | the whole line |
| `$1`, `$2`… | fields |
| `$NF` | the last field |
| `NR` | line number |
| `NF` | number of fields |

---

## The -F separator

```bash
df -h | awk 'NR>1 {print $1, $5, $6}'
```

**`NR>1`** — skip the `df` header.

---

## Conditions

```bash
awk -F: '$3 >= 1000 {print $1}' /etc/passwd
awk '/error|fail/i {count++} END {print count+0}' log.txt
```

---

## BEGIN and END

```bash
awk '{sum+=$1} END {print "total", sum}' numbers.txt
awk 'BEGIN {print "uid\tuser"} {print $3"\t"$1}' /etc/passwd | head
```

**END** runs after all lines — totals, aggregates.

---

## printf — aligned columns

```bash
awk -F: '{printf "%-15s %6s %s\n", $1, $3, $6}' /etc/passwd | head
```

---

## journal + awk (example)

```bash
journalctl -u ssh --no-pager -n 2000 2>/dev/null | \
  awk '/Failed password/ {ip[$11]++} END {for (i in ip) print ip[i], i}' | sort -rn | head
```

**Important:** the field number of the IP depends on the log format — check `awk '{print $11}'` on a single line.

---

## ss / ports

```bash
ss -tlnp 2>/dev/null | awk 'NR>1 {print $4}' | sed 's/.*://' | sort -n | uniq -c | sort -rn | head
```

---

## When not awk

| Data | Tool |
|--------|------------|
| JSON | `jq` |
| YAML | `yq`, Python |
| complex logic | Python |
| CSV with quotes | `mlr`, Python csv |

---

## Common mistakes

| Mistake | Fix |
|--------|-------------|
| forgot `-F:` for passwd | wrong fields |
| comparing strings as numbers | coerce with `$5+0` |
| a huge file without buffering | awk is OK; avoid a shell while loop |

---

## In production

Cron reports: awk + mail. For metrics — Prometheus, not awk in cron for a year.

---

## Summary

**awk** — fields, filters, **END** for sums. **`-F`**, **`NR`**, **`$NF`**. Verify field numbers against a real log line.

## Checklist

- [ ] How do you print the 1st and last field?
- [ ] Why `NR>1` for `df -h`?
- [ ] Where does the END block run?
- [ ] When to use jq instead of awk?

Next lesson: [12. Lab: awk](12-lab-awk.md).
