# 08. Лаба: deploy.sh с getopts

## Цель лабы

Собрать **`deploy.sh`** с **getopts** (`-e`, `-n`, `-h`), валидацией ENV, **dry-run** и одним реальным **ssh** на стенд — как мини deploy из GitLab CI.

## Предварительно

- [07. getopts](07-getopts.md).
- SSH `course@172.28.0.11` с lab.

```bash
docker compose exec lab bash
```

---

## Подготовка

```bash
ssh -o BatchMode=yes course@172.28.0.11 hostname
```

---

## Задание 1. Полный скрипт

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

## Задание 2. Вызовы

```bash
/tmp/deploy.sh -h 2>&1 | head -5
/tmp/deploy.sh -e staging
echo "exit=$?"
/tmp/deploy.sh -e staging -n -- extra-arg1 extra-arg2
/tmp/deploy.sh 2>&1; echo "no -e exit=$?"
/tmp/deploy.sh -x 2>&1; echo "bad opt exit=$?"
```

| Вызов | Ожидание |
|-------|----------|
| `-e staging` | hostname srv1 |
| `-n` | сообщение dry-run, без ssh |
| без `-e` | usage, exit 1 |

---

## Задание 3. OPTIND (учебно)

```bash
bash -c 'while getopts ":ab:" o; do echo o=$o OPTARG=$OPTARG; done; echo OPTIND=$OPTIND' -- -a foo -b bar rest
```

**Что увидите:** как OPTIND сдвигается; `rest` — позиционные после опций.

---

## Задание 4. Таблица в тетради

| ENV | HOST | dry-run |
|-----|------|---------|
| staging | 172.28.0.11 | нет |
| prod | 172.28.0.20 | да (-n) |

---

## Критерии успеха

- [ ] `-e staging` выполняет ssh hostname
- [ ] `-n` не вызывает ssh
- [ ] Без `-e` и с `-x` — ошибка и exit 1
- [ ] `shift $((OPTIND-1))` в скрипте есть

## Что унести в работу

- CI: `./deploy.sh -e "$CI_ENVIRONMENT_NAME" -n` на review, без `-n` на deploy.

Следующий урок: [09. sed](09-sed.md).
