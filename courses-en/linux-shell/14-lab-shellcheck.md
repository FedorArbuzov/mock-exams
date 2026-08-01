# 14. Lab: fix shellcheck warnings

## Lab goal

Install **shellcheck**, get ≥3 findings on a **deliberately bad** script, fix it down to **zero errors** in **good.sh**, and check **examples/bin**.

## Prerequisites

- [13. shellcheck](13-shellcheck.md).

```bash
docker compose exec lab bash
sudo apt install -y shellcheck
shellcheck --version
```

---

## Task 1. The bad script

```bash
cat > /tmp/bad.sh <<'EOF'
#!/bin/bash
cd /tmp
files=$1
for f in $files; do
  cat $f
  rm $f
done
EOF
shellcheck /tmp/bad.sh | tee /tmp/bad-sc.txt
wc -l /tmp/bad-sc.txt
```

Write down **3 SC codes** from the output (for example SC2086, SC2164, SC2145).

---

## Task 2. The fixed version

```bash
cat > /tmp/good.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /tmp || exit 1
files=${1:-}
[[ -n "$files" ]] || { echo "usage: $0 files..." >&2; exit 1; }
for f in $files; do
  [[ -f "$f" ]] || continue
  cat -- "$f"
done
EOF
shellcheck /tmp/good.sh
echo "shellcheck exit=$?"
```

**Expectation:** exit 0, no errors.

---

## Task 3. Comparison

```bash
diff -u /tmp/bad.sh /tmp/good.sh | head -30
```

Note: shebang, set, quotes, `cd || exit`.

---

## Task 4. examples from the repository

From the repo root:

```bash
shellcheck courses/linux-shell/examples/bin/*.sh
echo "exit=$?"
```

If there are findings — fix them or note them in your notebook for the final.

---

## Task 5. CI snippet

```bash
cat > /tmp/ci-shellcheck.yml <<'EOF'
lint-shell:
  stage: test
  script:
    - apt-get update && apt-get install -y shellcheck
    - shellcheck courses/linux-shell/examples/bin/*.sh
EOF
cat /tmp/ci-shellcheck.yml
```

---

## Success criteria

- [ ] bad.sh — ≥3 shellcheck findings
- [ ] good.sh — shellcheck exit 0
- [ ] You know SC2086 (quotes)
- [ ] examples checked

## What to take into your work

- pre-commit hook: `shellcheck` on staged `*.sh`.
- Don't merge scripts with shellcheck errors.

Next lesson: [15. Healthcheck](15-healthcheck.md).
