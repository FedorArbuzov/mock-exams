# 13. shellcheck — static analysis of bash

## Intro: the script works until there's a space in the path

`for f in $files` + a file `my doc.txt` → two words, `cat` breaks. The script "worked for years" until a space appeared in a name. **ShellCheck** catches typical bash pitfalls **before** the merge into main.

## What you'll learn

- Installing and running **shellcheck**.
- Levels: error, warning, info, style.
- Common codes **SC2086**, **SC2155**, **SC2164**.
- Integration into **GitLab CI**.
- When to **disable** a rule — rarely and with a reason.

---

## Running

```bash
sudo apt install -y shellcheck
shellcheck myscript.sh
shellcheck -x sourced.sh    # follow source
```

Online: [shellcheck.net](https://www.shellcheck.net/)

---

## Levels

| Level | Action in CI |
|---------|----------------|
| error | fail job |
| warning | fail or warn |
| info/style | optional |

---

## Common SC

| Code | Problem | Fix |
|-----|----------|-------------|
| SC2086 | `$var` without quotes | `"$var"` |
| SC2155 | declare and assign | split local and assignment |
| SC2164 | `cd` without a check | `cd ... \|\| exit` |
| SC2046 | `for i in $(ls)` | `for i in *` |
| SC2006 | backticks | `$(...)` |
| SC2181 | checking `$?` separately | `if cmd; then` |

---

## Example

**Bad:**

```bash
#!/bin/bash
files=$1
for f in $files; do
  cat $f
done
```

**Better:**

```bash
#!/usr/bin/env bash
set -euo pipefail
files=${1:-}
[[ -n "$files" ]] || exit 1
for f in $files; do
  [[ -f "$f" ]] || continue
  cat -- "$f"
done
```

```bash
shellcheck good.sh
```

---

## GitLab CI

```yaml
lint-shell:
  stage: test
  image: ubuntu:22.04
  script:
    - apt-get update && apt-get install -y shellcheck
    - find courses/linux-shell/examples/bin -name '*.sh' -print0 | xargs -0 shellcheck -x
```

---

## Disabling a rule

```bash
# shellcheck disable=SC2034  # reserved for future API_VERSION
UNUSED=1
```

Only with a comment on **why**.

---

## Relation to strict mode

`set -u` + quotes — fewer SC2086 warnings. ShellCheck and strict mode complement each other.

---

## Summary

**shellcheck** before every commit of shell scripts. Fail CI on **errors**. Quotes and `set -euo pipefail` — the baseline.

## Checklist

- [ ] Why `"$@"`?
- [ ] What is SC2086?
- [ ] Where to run it in the pipeline?

Next lesson: [14. Lab: shellcheck](14-lab-shellcheck.md).
