# 05. test, [[ ]], case

## Intro: "if [ $var = prod ]" and an empty $var

A classic mistake: the variable is empty, the condition **`[ $var = prod ]`** turns into **`[ = prod ]`** — a syntax error or an unexpected match. In DevOps bash scripts, conditions are the basis of deploy branching, config checks and argument validation.

## What you'll learn

- **`[[ ]]`** vs **`[ ]`** (test).
- Checks on files, strings, numbers.
- **`case`** for ENV and modes.
- **`(( ))`** for arithmetic.
- **`if/elif/else`** with systemd/curl commands.

---

## Two syntaxes

| | `[ ... ]` | `[[ ... ]]` |
|---|-----------|-------------|
| Shell | POSIX test | bash |
| Strings | fewer capabilities | `==`, regex `=~`, `&&` inside |
| Recommendation | sh compatibility | **new bash scripts** |

**Always** quote: `"$var"`.

---

## Files and directories

```bash
[[ -f /etc/passwd ]]      # regular file
[[ -d /var/log ]]         # directory
[[ -e /tmp/maybe ]]       # exists
[[ -r /etc/shadow ]]      # readable
[[ -x /usr/bin/curl ]]    # executable
[[ -s file.txt ]]         # size > 0
[[ -L /path ]]            # symlink
```

---

## Strings

```bash
[[ -z "$var" ]]            # empty
[[ -n "$var" ]]            # not empty
[[ "$a" == "$b" ]]
[[ "$file" == *.log ]]     # glob in bash [[ ]]
[[ "$ver" =~ ^[0-9]+\.[0-9]+$ ]]   # regex
```

---

## Numbers

```bash
[[ $count -gt 10 ]]
[[ $a -eq $b ]]
```

| Operator | Meaning |
|----------|----------|
| `-eq`, `-ne` | equal / not equal |
| `-lt`, `-le`, `-gt`, `-ge` | comparison |

Arithmetic:

```bash
(( count > 10 )) && echo big
(( count++ ))
```

---

## Logic inside [[ ]]

```bash
if [[ -f "$f" && -r "$f" ]]; then
  cat "$f"
fi

[[ -z "$x" || "$x" == "default" ]]
```

---

## case — branching by value

```bash
ENV=${1:-dev}

case "$ENV" in
  prod|production)
    REPLICAS=5
    URL="https://api.example.com"
    ;;
  stage|staging)
    REPLICAS=2
    URL="https://stage.example.com"
    ;;
  dev|development|"")
    REPLICAS=1
    URL="http://localhost:8080"
    ;;
  *)
    echo "Unknown ENV: $ENV" >&2
    exit 1
    ;;
esac
```

| Pattern | Meaning |
|---------|--------|
| `a\|b` | a or b |
| `*` | any string |
| `?)` | one character |
| `*)` | default — **mandatory** for safety |

---

## if with commands

```bash
if systemctl is-active --quiet nginx; then
  echo "nginx running"
elif systemctl is-enabled --quiet nginx 2>/dev/null; then
  echo "enabled but stopped"
else
  echo "not configured"
fi

if curl -sf http://127.0.0.1/ >/dev/null; then
  echo "http ok"
fi
```

With **`set -e`**: a condition in `if` does **not** trigger errexit on false.

---

## Common mistakes

| Mistake | Fix |
|--------|-------------|
| `[ $a = $b ]` without quotes | `[[ "$a" == "$b" ]]` |
| `=` instead of `==` in [[ ]] | `==` for strings |
| forgot `*)` in case | unknown ENVs pass silently |
| comparing numbers as strings | `-eq` or `(( ))` |

---

## In production

Validate ENV/REGION at the start of the script — `case` + exit 1. Don't mix **separate** `if`s for mutually exclusive modes — a single `case` is more readable.

---

## Summary

**`[[ ]]`** — the main tool for conditions in bash. **`case`** — for deploy modes. Quotes and a **default `*)`** are mandatory.

## Checklist

- [ ] When is `[[ ]]` better than `[ ]`?
- [ ] How do you check for a non-empty variable?
- [ ] Why `*)` in case?
- [ ] How does `-eq` differ from `==`?

Next lesson: [06. Lab: tests](06-lab-test.md).
