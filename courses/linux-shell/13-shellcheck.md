# 13. shellcheck — статический анализ bash

## Введение: скрипт работает, пока в пути нет пробела

`for f in $files` + файл `my doc.txt` → два слова, `cat` ломается. Скрипт «работал годами», пока не появился пробел в имени. **ShellCheck** ловит типичные bash-ловушки **до** merge в main.

## Что вы узнаете

- Установка и запуск **shellcheck**.
- Уровни: error, warning, info, style.
- Частые коды **SC2086**, **SC2155**, **SC2164**.
- Интеграция в **GitLab CI**.
- Когда **disable** правило — редко и с причиной.

---

## Запуск

```bash
sudo apt install -y shellcheck
shellcheck myscript.sh
shellcheck -x sourced.sh    # follow source
```

Онлайн: [shellcheck.net](https://www.shellcheck.net/)

---

## Уровни

| Уровень | Действие в CI |
|---------|----------------|
| error | fail job |
| warning | fail или warn |
| info/style | опционально |

---

## Частые SC

| Код | Проблема | Исправление |
|-----|----------|-------------|
| SC2086 | `$var` без кавычек | `"$var"` |
| SC2155 | declare and assign | разделить local и присвоение |
| SC2164 | `cd` без проверки | `cd ... \|\| exit` |
| SC2046 | `for i in $(ls)` | `for i in *` |
| SC2006 | backticks | `$(...)` |
| SC2181 | проверка `$?` отдельно | `if cmd; then` |

---

## Пример

**Плохо:**

```bash
#!/bin/bash
files=$1
for f in $files; do
  cat $f
done
```

**Лучше:**

```bash
#!/usr/bin/env bash
set -euo pipefail
files=${1:-}
[[ -n "$files" ]] || exit 1
for f in $files; do
  [[ -f "$f" ]] || continue
  cat -- "$f"
done
```

```bash
shellcheck good.sh
```

---

## GitLab CI

```yaml
lint-shell:
  stage: test
  image: ubuntu:22.04
  script:
    - apt-get update && apt-get install -y shellcheck
    - find courses/linux-shell/examples/bin -name '*.sh' -print0 | xargs -0 shellcheck -x
```

---

## Отключение правила

```bash
# shellcheck disable=SC2034  # reserved for future API_VERSION
UNUSED=1
```

Только с комментарием **почему**.

---

## Связь со strict mode

`set -u` + кавычки — меньше предупреждений SC2086. ShellCheck и strict mode дополняют друг друга.

---

## Резюме

**shellcheck** перед каждым commit shell-скриптов. Fail CI на **errors**. Кавычки и `set -euo pipefail` — база.

## Чек-лист

- [ ] Зачем `"$@"`?
- [ ] Что такое SC2086?
- [ ] Где запускать в pipeline?

Следующий урок: [14. Лаба: shellcheck](14-lab-shellcheck.md).
