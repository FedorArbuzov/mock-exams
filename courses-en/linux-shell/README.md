# Linux — Shell (specialization)

Bash for DevOps: **strict mode**, functions, **test/case**, **getopts**, **sed/awk**, **shellcheck**, healthcheck and scripts for CI.

**After:** [linux-basic](../linux-basic/README.md) — files, permissions, systemd, basic shell.

**Locally:** [`deploy/linux`](../../deploy/linux/README.md) — lab `172.28.0.10`, web `172.28.0.20`, srv1 `172.28.0.11`.

## How to read the course

1. **Theory** (01, 03, 05…) — why it matters in CI/on the server, syntax, examples, common mistakes.
2. **Lab** (02, 04…) — you write a script on lab, then check the output and exit code.
3. Before commit — **`shellcheck`** (lessons 13–14).
4. Examples in [`examples/bin/`](examples/bin/README.md).

**Time:** ~45–60 minutes per "theory + lab" pair; [final](16-final-project.md) — **2–4 hours**.

## Curriculum

| # | Theory | Lab |
|---|--------|------|
| 01 | [Strict mode](01-bash-strict.md) | [02](02-lab-strict.md) |
| 03 | [Functions](03-functions.md) | [04](04-lab-functions.md) |
| 05 | [test / case](05-test-case.md) | [06](06-lab-test.md) |
| 07 | [getopts](07-getopts.md) | [08](08-lab-cli.md) |
| 09 | [sed](09-sed.md) | [10](10-lab-sed.md) |
| 11 | [awk](11-awk.md) | [12](12-lab-awk.md) |
| 13 | [shellcheck](13-shellcheck.md) | [14](14-lab-shellcheck.md) |
| 15 | [Healthcheck](15-healthcheck.md) | — |
| 16 | [Final project](16-final-project.md) | |

## What you should end up with

- You write bash with `set -euo pipefail` and deliberate `|| true`.
- You split scripts into functions with `local` and `main`.
- You parse flags with **getopts**.
- You edit configs with **sed**, reports with **awk**.
- You run **shellcheck** in CI before merge.
- You build **check-host / deploy-smoke / log-report** for GitLab.

## Related courses

| Course | Relation |
|------|-------|
| [gitlab-basic](../gitlab-basic/README.md) | a job's `script:` calls your `.sh` files |
| [linux-intermediate](../linux-intermediate/README.md) | curl, ssh, nginx on the stand |
| [linux-advanced](../linux-advanced/README.md) | deploy user, verify-node |
