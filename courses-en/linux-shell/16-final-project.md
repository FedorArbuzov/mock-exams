# 16. Final project: bin/ for CI

## Intro: three scripts instead of magic in .gitlab-ci.yml

A long `script:` in YAML isn't reviewable, isn't tested with shellcheck locally, and gets duplicated between projects. The **final** — move the logic into `courses/linux-shell/examples/bin/` and call it from GitLab CI as in [gitlab-basic](../gitlab-basic/README.md).

**Time:** 2–4 hours.

## Goal

Build **three** bash scripts + an updated **README** that pass **shellcheck** and a smoke test on the `deploy/linux` stand.

---

## Script 1: check-host.sh

| Check | Implementation |
|----------|------------|
| TCP 22 (or 80) | `/dev/tcp` + timeout |
| disk root < 90% | `df` + awk |
| load average | `uptime` or `/proc/loadavg` |

**Output:** `key=value` lines for CI artifacts:

```text
host=172.28.0.11
tcp_22=ok
disk_root_pct=42
load_1m=0.15
status=ok
```

```bash
./check-host.sh 172.28.0.11
echo "exit=$?"
```

**Requirements:** strict mode, functions, `local`, usage on an empty HOST.

---

## Script 2: deploy-smoke.sh

| Element | Requirement |
|---------|------------|
| CLI | **getopts** `-e ENV -H HOST [-n]` |
| HTTP | curl 200 on `http://HOST/` |
| SSH | `systemctl is-active nginx` (or your unit) |
| dry-run | `-n` — only echo, no ssh |

```bash
./deploy-smoke.sh -e lab -H 172.28.0.11
./deploy-smoke.sh -e lab -H 172.28.0.11 -n
```

---

## Script 3: log-report.sh

| Element | Requirement |
|---------|------------|
| Source | `journalctl --since "1 hour ago"` or a file |
| awk | count error / warn (END block) |
| sed | optionally: timestamp normalization |
| Output | `/tmp/report-${HOST}.txt` or stdout |

```bash
./log-report.sh 172.28.0.11
head -20 /tmp/report-172.28.0.11.txt
```

---

## Quality requirements

| # | Requirement |
|---|------------|
| 1 | `#!/usr/bin/env bash` + `set -euo pipefail` |
| 2 | Functions + **`local`** |
| 3 | **`shellcheck`** with no errors on all three |
| 4 | **`usage()`** on invalid arguments |
| 5 | [README](examples/bin/README.md) with call examples |
| 6 | Don't store secrets in the scripts |

---

## GitLab CI (example)

```yaml
stages:
  - lint
  - smoke

lint-shell:
  stage: lint
  script:
    - apt-get update && apt-get install -y shellcheck
    - shellcheck courses/linux-shell/examples/bin/*.sh

smoke-linux:
  stage: smoke
  script:
    - apt-get update && apt-get install -y curl openssh-client
    - bash courses/linux-shell/examples/bin/check-host.sh 172.28.0.11
    - bash courses/linux-shell/examples/bin/deploy-smoke.sh -e lab -H 172.28.0.11 -n
```

For a real ssh — a runner with a key and access to `172.28.0.0/24`.

---

## Step-by-step plan

1. Copy the stubs from labs 04, 08, 12 or extend the existing `healthcheck.sh` / `strict-demo.sh`.
2. `shellcheck` → fix.
3. Run on lab against web/srv1.
4. Update the README.
5. (Optionally) add a job to your `.gitlab-ci.yml`.

---

## Submission criteria

- [ ] 3 scripts in `examples/bin/`
- [ ] README with examples
- [ ] `shellcheck *.sh` — exit 0
- [ ] `check-host` and `deploy-smoke -n` pass on the stand
- [ ] `log-report` creates a file with error/warn counts

---

## Related courses

| Course | Relation |
|------|-------|
| [linux-basic](../linux-basic/README.md) | ssh, systemd |
| [gitlab-intermediate](../gitlab-intermediate/README.md) | deploy stages |
| [linux-advanced](../linux-advanced/26-deploy-user.md) | the deploy user |

---

## Summary

The final combines **strict**, **functions**, **getopts**, **awk/sed**, **shellcheck**, **healthcheck** into a toolkit for CI. Quality = shellcheck + smoke on lab + documentation.
