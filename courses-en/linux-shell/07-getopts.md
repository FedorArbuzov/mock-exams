# 07. getopts — parsing CLI arguments

## Intro: deploy.sh -e staging -n

Scripts in CI are called like this:

```bash
./deploy.sh -e staging -n -- --extra-args
```

Manual parsing of `$1`, `$2` breaks when the order of the flags changes. **getopts** is the standard way to handle **short** options `-e`, `-v`, `-h`.

## What you'll learn

- The **`while getopts`** loop and **`case $opt`**.
- The **optstring** (`:e:vh`).
- **`OPTARG`**, **`OPTIND`**, **`shift`**.
- **usage()** and the error codes `\?` and `:`.
- Limitations: no `--long` without extra libraries.

---

## Basic template

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

## The optstring

```text
":e:vh"
```

| Character | Meaning |
|--------|----------|
| leading `:` | silent mode — we handle a missing argument ourselves (the `:` case) |
| `e:` | `-e` **requires** a value |
| `v` | a flag without a value |
| `h` | help |

---

## getopts variables

| Variable | Contents |
|------------|------------|
| `$OPTARG` | the argument of the last option |
| `$OPTIND` | the index of the next positional `$1` |

After the loop, **mandatory**:

```bash
shift $((OPTIND - 1))
# $@ — positional arguments after the options
```

---

## Validating ENV

```bash
case "$ENV" in
  dev|stage|prod) ;;
  *) echo "Invalid ENV: $ENV" >&2; exit 1 ;;
esac
```

---

## dry-run flag

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

## Long options

getopts does **not** support `--environment`. Options:

- parse `$@` manually before getopts;
- `getopt` from util-linux;
- Python/Go for a complex CLI.

For bash in CI, `-e`, `-n`, `-v` are usually enough.

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| forgot `shift $((OPTIND-1))` | `$1` is still `-e` |
| `getopts` without a leading `:` | cryptic error |
| didn't check for an empty `-e` | deploy into an empty ENV |

---

## In production

`usage` prints to **stderr**, exits **1**. In CI, pass flags explicitly, don't rely on a default ENV=prod.

---

## Summary

**getopts** — the standard for `-flags`. **`shift $((OPTIND-1))`** — mandatory. Value validation — a separate **case** after parsing.

## Checklist

- [ ] Why `shift $((OPTIND-1))`?
- [ ] How does `-e:` differ from `-v`?
- [ ] What do `\?` and `:` do in case?

Next lesson: [08. Lab: CLI](08-lab-cli.md).
