# 08. Lab: deploy.sh with getopts

## Lab goal

Build **`deploy.sh`** with **getopts** (`-e`, `-n`, `-h`), ENV validation, **dry-run** and one real **ssh** to the stand — like a mini deploy from GitLab CI.

## Prerequisites

- [07. getopts](07-getopts.md).
- SSH `course@172.28.0.11` from lab.

```bash
docker compose exec lab bash
```

---

## Preparation

```bash
ssh -o BatchMode=yes course@172.28.0.11 hostname
```

---

## Task 1. The full script

```bash
cat > /tmp/deploy.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE >&2
Usage: $0 -e ENV [-n] [-h]
  -e ENV    dev | stage | prod (required)
  -n        dry-run only
  -h        help
USAGE
  exit 1
}

ENV=""
DRY_RUN=0

while getopts ":e:nh" opt; do
  case $opt in
    e) ENV=$OPTARG ;;
    n) DRY_RUN=1 ;;
    h) usage ;;
    \?) echo "Unknown: -$OPTARG" >&2; usage ;;
    :)  echo "-$OPTARG needs value" >&2; usage ;;
  esac
done
shift $((OPTIND - 1))

[[ -n "$ENV" ]] || usage

case "$ENV" in
  dev|stage|prod) ;;
  *) echo "Invalid ENV: $ENV" >&2; exit 1 ;;
esac

HOST="172.28.0.11"
[[ "$ENV" == "prod" ]] && HOST="172.28.0.20"

if (( DRY_RUN )); then
  echo "[dry-run] deploy to $ENV ($HOST), extra args: $*"
else
  echo "Deploying to $ENV at $HOST..."
  ssh -o BatchMode=yes -o ConnectTimeout=5 "course@$HOST" hostname
fi
EOF
chmod +x /tmp/deploy.sh
shellcheck /tmp/deploy.sh 2>/dev/null || true
```

---

## Task 2. Calls

```bash
/tmp/deploy.sh -h 2>&1 | head -5
/tmp/deploy.sh -e staging
echo "exit=$?"
/tmp/deploy.sh -e staging -n -- extra-arg1 extra-arg2
/tmp/deploy.sh 2>&1; echo "no -e exit=$?"
/tmp/deploy.sh -x 2>&1; echo "bad opt exit=$?"
```

| Call | Expectation |
|-------|----------|
| `-e staging` | hostname srv1 |
| `-n` | dry-run message, no ssh |
| without `-e` | usage, exit 1 |

---

## Task 3. OPTIND (for learning)

```bash
bash -c 'while getopts ":ab:" o; do echo o=$o OPTARG=$OPTARG; done; echo OPTIND=$OPTIND' -- -a foo -b bar rest
```

**What you'll see:** how OPTIND shifts; `rest` — positional arguments after the options.

---

## Task 4. Table in your notebook

| ENV | HOST | dry-run |
|-----|------|---------|
| staging | 172.28.0.11 | no |
| prod | 172.28.0.20 | yes (-n) |

---

## Success criteria

- [ ] `-e staging` runs ssh hostname
- [ ] `-n` does not call ssh
- [ ] Without `-e` and with `-x` — error and exit 1
- [ ] `shift $((OPTIND-1))` is present in the script

## What to take into your work

- CI: `./deploy.sh -e "$CI_ENVIRONMENT_NAME" -n` on review, without `-n` on deploy.

Next lesson: [09. sed](09-sed.md).
