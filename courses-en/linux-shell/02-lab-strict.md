# 02. Lab: strict mode and trap

## Lab goal

See in practice the difference **without strict** vs with **`set -euo pipefail`**, verify **pipefail**, **nounset** and **trap cleanup** — so in your own scripts you don't have to guess whether bash will stop on an error.

## Prerequisites

- [01. Strict mode](01-bash-strict.md).
- Stand: [`deploy/linux`](../../deploy/linux/README.md).

```bash
cd deploy/linux && docker compose up -d
docker compose exec lab bash
```

---

## Preparing the stand

```bash
bash --version | head -1
```

---

## Task 1. Demo without strict

**Why:** capture the "bad" default behavior.

```bash
cat > /tmp/no-strict.sh <<'EOF'
#!/bin/bash
false
echo "still running after false, exit code of false was masked in script: continuing"
EOF
chmod +x /tmp/no-strict.sh
/tmp/no-strict.sh
echo "script exit code: $?"
```

**What you'll see:** the line `still running...`; the script exit code is **0** (the last command is echo).

---

## Task 2. With strict

```bash
cat > /tmp/strict.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
false
echo "unreachable"
EOF
chmod +x /tmp/strict.sh
/tmp/strict.sh
echo "script exit code: $?"
```

**What you'll see:** `unreachable` is **not** printed; the exit code is **non-zero**.

---

## Task 3. nounset

```bash
bash -c 'set -u; echo "value=[$TYPO_VAR]"' 2>&1 || echo "failed as expected"
bash -c 'set -u; echo "ok with default: [${TYPO_VAR:-empty}]"'
```

---

## Task 4. pipefail

```bash
bash -c 'set -o pipefail; false | true; echo "exit=$?"'
bash -c 'set -o pipefail; true | false; echo "exit=$?"'
bash -c 'false | true; echo "without pipefail exit=$?"'
```

**Write down:** in the second case with pipefail the exit should be **non-zero**.

---

## Task 5. trap cleanup

```bash
cat > /tmp/trap-demo.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
TMP="/tmp/trap-demo.$$"
touch "$TMP"
cleanup() { rm -f "$TMP"; echo "cleaned $TMP"; }
trap cleanup EXIT
echo "working... file exists:"
ls -la "$TMP"
EOF
chmod +x /tmp/trap-demo.sh
/tmp/trap-demo.sh
ls /tmp/trap-demo.* 2>&1 || echo "file removed OK"
```

**Why:** even on `exit 0` cleanup runs.

---

## Task 6. trap ERR (optional)

```bash
cat > /tmp/trap-err.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
trap 'echo "ERR at line $LINENO" >&2' ERR
echo start
false
EOF
chmod +x /tmp/trap-err.sh
/tmp/trap-err.sh 2>&1 || true
```

---

## Task 7. Example from the repository

From the repo root (or copy the script into lab):

```bash
bash courses/linux-shell/examples/bin/strict-demo.sh
echo "exit=$?"
```

---

## Success criteria

- [ ] You explained to yourself: no-strict vs strict exit code
- [ ] pipefail changed the pipeline exit
- [ ] nounset failed on the typo
- [ ] trap removed `/tmp/trap-demo.*`

## What to take into your work

- The first lines of every `.sh` in the repo — the strict header.
- In a CI job a failure = a non-zero script exit, not just an `echo` at the end.

Next lesson: [03. Functions](03-functions.md).
