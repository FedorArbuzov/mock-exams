# 01. Strict mode: set -euo pipefail

## Intro: green CI, broken prod

A typical scenario: the **deploy** pipeline is green, in the middle of the log there is a `curl: (7) Failed to connect`, but the job continued and reached `echo "Deploy success"`. The reason: bash **did not stop** on the error. The migration was not applied, the cache was not flushed, and the script kept going and deleted the "old" artifacts.

**Strict mode** — four settings at the start of the file that make failure **predictable**. It is the standard for scripts in CI/CD, Ansible hooks and cron on servers.

## What you'll learn

- The flags **`-e`**, **`-u`**, **`pipefail`** and **`IFS`**.
- **`trap`** for cleanup and error messages.
- When to **deliberately** disable `-e` (`|| true`, `set +e`).
- A header template for a production script.
- Why the shebang is **`bash`**, not **`sh`**.

---

## Baseline line

```bash
#!/usr/bin/env bash
set -euo pipefail
```

| Flag | Name | Behavior |
|------|-----|-----------|
| `-e` | errexit | Exit if a command returned a **non-zero** code (exceptions: parts of `if`, `while`, `\|\|`, `&&` constructs) |
| `-u` | nounset | Error when accessing an **undeclared** variable |
| `-o pipefail` | pipefail | The pipeline `a \| b` fails if **any** command in the chain fails |
| `IFS=$'\n\t'` | (often added) | Safer word splitting; a space in a path does not break the loop |

---

## Example without `-e` (dangerous)

```bash
#!/bin/bash
migrate_db    # failed with exit 1
echo "Migration OK"
deploy_app
echo "Deploy success"   # CI green, prod broken
```

## With `-e`

```bash
#!/usr/bin/env bash
set -euo pipefail
migrate_db
echo "We won't get here if migrate_db failed"
```

The **exit code** of the whole script = the code of the first failed command — GitLab/GitHub Actions mark the job as failed.

---

## nounset (`-u`)

```bash
echo "Deploy to $ENVIRNOMENT"   # typo → empty string, deploy "into the void"
```

```bash
set -u
echo "$ENVIRNOMENT"   # bash: ENVIRNOMENT: unbound variable
```

**Practice:** required variables — `${VAR:?message}`:

```bash
HOST=${1:?usage: $0 HOST}
```

---

## pipefail

```bash
curl -sf http://bad-host/status | jq -r .status
echo "pipeline exit: $?"
```

| Mode | Pipeline exit if curl fails |
|-------|-------------------------------|
| without pipefail | often **0** (jq succeeds on empty input) |
| with pipefail | **non-zero** (curl error) |

In CI, chains like `curl | jq`, `grep | wc`, `terraform plan | tee` — **always** `set -o pipefail`.

---

## trap — cleanup and ERR

```bash
#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp)"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

on_err() {
  echo "ERROR at line $LINENO: command failed (exit $?)" >&2
}
trap on_err ERR

# ... work ...
```

| trap | When |
|------|--------|
| `EXIT` | on any exit (success, exit, signal) |
| `ERR` | on a command error (with `-e`) |

**Why:** temporary files, mounts, `cd` into a subdirectory — don't leave junk behind.

---

## Deliberate exceptions

Don't wrap **everything** in `|| true` — only where an error is **expected**:

```bash
# the process may not exist
pkill mydaemon 2>/dev/null || true

grep pattern /etc/config || true   # no match — not an error

set +e
optional_step
rc=$?
set -e
if [[ $rc -ne 0 ]]; then
  log WARN "optional_step failed, continuing"
fi
```

| Pattern | When |
|---------|--------|
| `cmd \|\| true` | "not found" — normal |
| `if cmd; then` | a check without disabling `-e` |
| `set +e` / `set -e` | a block with manual `$?` handling |

---

## Shebang and shell

```bash
#!/usr/bin/env bash    # preferred
```

On Ubuntu **`/bin/sh`** is often **dash** — no `[[ ]]`, different rules. The course scripts are **bash**.

---

## Production script header template

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# readonly LOG_LEVEL="${LOG_LEVEL:-info}"
```

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| only `-e`, no `pipefail` | silent fail in a pipeline |
| `set -u` without a default for options | crash on empty `$2` |
| trap without quotes in `rm -f "$TMP"` | paths with spaces |
| `#!/bin/sh` + `[[` | the script won't run |

---

## In production

- Pre-commit / CI: **shellcheck** + running test scenarios.
- Log **`set -x`** only in debug (`DEBUG=1`).
- In a Docker `ENTRYPOINT` — the same strict header.

---

## Summary

**Strict mode** catches most "green CI, red prod" cases. **`pipefail`** is mandatory for `|`. **`trap EXIT`** — cleanup. Exceptions are **deliberate**, with a comment.

## Checklist

- [ ] What breaks without `pipefail` in `curl | jq`?
- [ ] Why `trap cleanup EXIT`?
- [ ] Why is `|| true` an exception, not a way of life?
- [ ] How is `#!/usr/bin/env bash` better than `sh`?

Next lesson: [02. Lab: strict](02-lab-strict.md).
