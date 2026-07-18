# 03. Функции, local и возвращаемые значения

## Введение: copy-paste в пяти deploy-скриптах

Один и тот же блок «curl с retry + лог timestamp» скопирован в пять репозиториев. В одном забыли `-f` у curl — половина деплоев «успешна» с 404. **Функции** дают одно место для логики, читаемый `main` и проще тестировать куски скрипта.

## Что вы узнаете

- Синтаксис функций и **`main "$@"`**.
- **`$1`**, **`$@`**, **`$#`**, значения по умолчанию.
- **`local`** — почему обязателен.
- **`return`** vs **`exit`**.
- Как «вернуть строку» через **`$(...)`**.
- Паттерны: log, retry, port check.

---

## Синтаксис

```bash
log() {
  echo "[$(date -Iseconds)] $*" >&2
}

log "starting deploy"
```

Предпочтительно без ключевого слова `function` (портативнее стиль).

---

## Параметры

```bash
greet() {
  local name="${1:-world}"
  echo "Hello, $name"
}
greet Alice
greet
```

| Переменная | Значение |
|------------|----------|
| `$1`, `$2`… | позиционные аргументы функции |
| `$@` | все аргументы как отдельные слова |
| `$#` | количество аргументов |
| `${1:-default}` | default если пусто |

Проброс в команду:

```bash
run_all() {
  "$@"    # вызов: run_all ls -la /tmp
}
```

---

## local — обязательно

```bash
counter=0
bad_increment() {
  counter=$((counter + 1))   # меняет ГЛОБАЛЬНУЮ counter
}

good_increment() {
  local n="${1:-0}"
  echo $((n + 1))
}
next=$(good_increment 5)
```

Без **`local`** функция затирает переменные вызывающего кода — баги в больших скриптах.

---

## return vs exit

| | `return N` | `exit N` |
|---|------------|----------|
| Область | только функция | весь скрипт |
| Код | 0–255 | 0–255 |

```bash
check_file() {
  [[ -f "$1" ]] || return 1
}
if check_file /etc/passwd; then echo OK; fi
```

---

## «Возврат строки»

bash не возвращает строки. Идиома:

```bash
get_primary_ip() {
  hostname -I | awk '{print $1}'
}
ip="$(get_primary_ip)"
```

Для нескольких значений — `echo` построчно или разделитель, парсинг через `read`:

```bash
read -r ip gw < <(get_network_info)
```

---

## Практические функции

### Логирование в stderr

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

### TCP-порт (bash /dev/tcp)

```bash
port_open() {
  local host=$1 port=$2
  timeout 2 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null
}
port_open 172.28.0.11 22 && echo "ssh open"
```

---

## Стиль main()

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

**`"$@"`** сохраняет кавычки в аргументах.

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| нет `local` | случайная перезапись globals |
| `return 300` | modulo 256 |
| `$(log INFO msg)` | лишний subshell, теряется stderr context |
| огромные функции | разбить на файлы + `source` |

---

## В продакшене

Общие функции — файл `lib/common.sh` и `source "$SCRIPT_DIR/lib/common.sh"`. Не `source` из интернета без pin/commit.

---

## Резюме

Функции структурируют bash. **`local`** — всегда для внутренних переменных. Строки — через **`echo` + `$()`**. **`exit`** только когда нужно убить весь скрипт.

## Чек-лист

- [ ] Зачем `local`?
- [ ] Как вернуть строку?
- [ ] Чем `return 1` отличается от `exit 1`?
- [ ] Зачем `main "$@"` в конце?

Следующий урок: [04. Лаба: functions](04-lab-functions.md).
