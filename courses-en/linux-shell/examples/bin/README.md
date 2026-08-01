# linux-shell scripts

Examples for the course. Run them from the repository root or copy them onto lab.

## Scripts

| Script | Purpose | Example |
|--------|------------|--------|
| `strict-demo.sh` | demo of `set -euo pipefail` | `bash strict-demo.sh` |
| `healthcheck.sh` | HTTP + optionally SSH | `bash healthcheck.sh 172.28.0.20` |

## Final project (add these yourself)

| Script | Purpose |
|--------|------------|
| `check-host.sh` | TCP, disk, load → key=value |
| `deploy-smoke.sh` | getopts, curl, systemctl |
| `log-report.sh` | journal + awk error/warn |

## Quality check

```bash
shellcheck courses/linux-shell/examples/bin/*.sh
bash courses/linux-shell/examples/bin/healthcheck.sh 172.28.0.20
echo "exit=$?"
```

## Stand

[`deploy/linux`](../../../deploy/linux/README.md):

| Host | IP |
|------|-----|
| lab | 172.28.0.10 |
| srv1 | 172.28.0.11 |
| web | 172.28.0.20 |

SSH: **course** / **course**

## Requirements for new scripts

```bash
#!/usr/bin/env bash
set -euo pipefail
# functions + local
# usage() on bad args
# shellcheck clean
```

See [16-final-project.md](../../16-final-project.md).
