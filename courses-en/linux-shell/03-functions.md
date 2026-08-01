# 03. Functions, local and return values

## Intro: copy-paste across five deploy scripts

The same "curl with retry + timestamp log" block is copied into five repositories. In one of them the `-f` on curl was forgotten — half the deploys are "successful" with a 404. **Functions** give one place for the logic, a readable `main`, and make it easier to test pieces of the script.

## What you'll learn

- Function syntax and **`main "$@"`**.
- **`$1`**, **`$@`**, **`$#`**, default values.
- **`local`** — why it's mandatory.
- **`return`** vs **`exit`**.
- How to "return a string" via **`$(...)`**.
- Patterns: log, retry, port check.

---

## Syntax

```bash
log() {
  echo "[$(date -Iseconds)] $*" >&2
}

log "starting deploy"
```

Preferably without the `function` keyword (a more portable style).

---

## Parameters

```bash
greet() {
  local name="${1:-world}"
  echo "Hello, $name"
}
greet Alice
greet
```

| Variable | Meaning |
|------------|----------|
| `$1`, `$2`… | positional arguments of the function |
| `$@` | all arguments as separate words |
| `$#` | number of arguments |
| `${1:-default}` | default if empty |

Forwarding to a command:

```bash
run_all() {
  "$@"    # call: run_all ls -la /tmp
}
```

---

## local — mandatory

```bash
counter=0
bad_increment() {
  counter=$((counter + 1))   # changes the GLOBAL counter
}

good_increment() {
  local n="${1:-0}"
  echo $((n + 1))
}
next=$(good_increment 5)
```

Without **`local`** a function overwrites the caller's variables — bugs in large scripts.

---

## return vs exit

| | `return N` | `exit N` |
|---|------------|----------|
| Scope | function only | the whole script |
| Code | 0–255 | 0–255 |

```bash
check_file() {
  [[ -f "$1" ]] || return 1
}
if check_file /etc/passwd; then echo OK; fi
```

---

## "Returning a string"

bash does not return strings. The idiom:

```bash
get_primary_ip() {
  hostname -I | awk '{print $1}'
}
ip="$(get_primary_ip)"
```

For several values — `echo` line by line or a separator, parsed via `read`:

```bash
read -r ip gw < <(get_network_info)
```

---

## Practical functions

### Logging to stderr

```bash
log() {
  local level="${1:?level required}"
  shift
  echo "[$(date -Iseconds)] [$level] $*" >&2
}
log INFO "deploy started"
```

### Retry

```bash
retry() {
  local max=${1:-5}
  shift
  local n=0
  until "$@"; do
    n=$((n + 1))
    [[ $n -ge $max ]] && return 1
    sleep 2
  done
}
retry 3 curl -sf http://172.28.0.20/
```

### TCP port (bash /dev/tcp)

```bash
port_open() {
  local host=$1 port=$2
  timeout 2 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null
}
port_open 172.28.0.11 22 && echo "ssh open"
```

---

## main() style

```bash
deploy() {
  local env=$1
  log INFO "deploy to $env"
  # ...
}

main() {
  local env=${1:?usage: $0 ENV}
  deploy "$env"
}

main "$@"
```

**`"$@"`** preserves quoting in the arguments.

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| no `local` | accidental overwrite of globals |
| `return 300` | modulo 256 |
| `$(log INFO msg)` | extra subshell, loses stderr context |
| huge functions | split into files + `source` |

---

## In production

Shared functions — a `lib/common.sh` file and `source "$SCRIPT_DIR/lib/common.sh"`. Don't `source` from the internet without a pin/commit.

---

## Summary

Functions structure bash. **`local`** — always for internal variables. Strings — via **`echo` + `$()`**. **`exit`** only when you need to kill the whole script.

## Checklist

- [ ] Why `local`?
- [ ] How do you return a string?
- [ ] How does `return 1` differ from `exit 1`?
- [ ] Why `main "$@"` at the end?

Next lesson: [04. Lab: functions](04-lab-functions.md).
