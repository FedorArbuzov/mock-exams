# 07. getopts — разбор аргументов CLI

## Введение: deploy.sh -e staging -n

Скрипты в CI вызывают так:

```bash
./deploy.sh -e staging -n -- --extra-args
```

Ручной разбор `$1`, `$2` ломается при смене порядка флагов. **getopts** — стандартный способ для **коротких** опций `-e`, `-v`, `-h`.

## Что вы узнаете

- Цикл **`while getopts`** и **`case $opt`**.
- Строка **optstring** (`:e:vh`).
- **`OPTARG`**, **`OPTIND`**, **`shift`**.
- **usage()** и коды ошибок `\?` и `:`.
- Ограничения: нет `--long` без доп. библиотек.

---

## Базовый шаблон

```bash
#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 -e ENV [-v] [-h]" >&2
  echo "  -e ENV   environment: dev|stage|prod" >&2
  echo "  -v       verbose" >&2
  exit 1
}

ENV=""
VERBOSE=0

while getopts ":e:vh" opt; do
  case $opt in
    e) ENV=$OPTARG ;;
    v) VERBOSE=1 ;;
    h) usage ;;
    \?) echo "Invalid option: -$OPTARG" >&2; usage ;;
    :)  echo "Option -$OPTARG requires an argument" >&2; usage ;;
  esac
done

shift $((OPTIND - 1))

[[ -n "$ENV" ]] || usage

echo "ENV=$ENV VERBOSE=$VERBOSE"
echo "Remaining: $*"
```

---

## Строка optstring

```text
":e:vh"
```

| Символ | Значение |
|--------|----------|
| leading `:` | тихий режим — сами обрабатываем отсутствие аргумента (`:` case) |
| `e:` | `-e` **требует** значение |
| `v` | флаг без значения |
| `h` | help |

---

## Переменные getopts

| Переменная | Содержимое |
|------------|------------|
| `$OPTARG` | аргумент последней опции |
| `$OPTIND` | индекс следующего позиционного `$1` |

После цикла **обязательно**:

```bash
shift $((OPTIND - 1))
# $@ — позиционные аргументы после опций
```

---

## Валидация ENV

```bash
case "$ENV" in
  dev|stage|prod) ;;
  *) echo "Invalid ENV: $ENV" >&2; exit 1 ;;
esac
```

---

## dry-run флаг

```bash
DRY_RUN=0
while getopts ":e:n" opt; do
  case $opt in
    e) ENV=$OPTARG ;;
    n) DRY_RUN=1 ;;
  esac
done
shift $((OPTIND - 1))

if (( DRY_RUN )); then
  echo "[dry-run] would deploy to $ENV, args: $*"
else
  echo "Deploying to $ENV..."
fi
```

---

## Длинные опции

getopts **не** поддерживает `--environment`. Варианты:

- разобрать `$@` вручную до getopts;
- `getopt` из util-linux;
- Python/Go для сложного CLI.

Для bash в CI обычно хватает `-e`, `-n`, `-v`.

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| забыли `shift $((OPTIND-1))` | `$1` всё ещё `-e` |
| `getopts` без leading `:` | cryptic error |
| не проверили пустой `-e` | deploy в пустой ENV |

---

## В продакшене

`usage` печатает в **stderr**, exit **1**. В CI передавайте флаги явно, не полагайтесь на default ENV=prod.

---

## Резюме

**getopts** — стандарт для `-flags`. **`shift $((OPTIND-1))`** — обязателен. Валидация значений — отдельный **case** после парсинга.

## Чек-лист

- [ ] Зачем `shift $((OPTIND-1))`?
- [ ] Чем `-e:` отличается от `-v`?
- [ ] Что делают `\?` и `:` в case?

Следующий урок: [08. Лаба: CLI](08-lab-cli.md).
