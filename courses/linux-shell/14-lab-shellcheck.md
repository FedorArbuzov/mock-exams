# 14. Лаба: исправить shellcheck warnings

## Цель лабы

Установить **shellcheck**, получить ≥3 замечания на **намеренно плохом** скрипте, исправить до **нуля errors** в **good.sh**, проверить **examples/bin**.

## Предварительно

- [13. shellcheck](13-shellcheck.md).

```bash
docker compose exec lab bash
sudo apt install -y shellcheck
shellcheck --version
```

---

## Задание 1. Плохой скрипт

```bash
cat > /tmp/bad.sh <<'EOF'
#!/bin/bash
cd /tmp
files=$1
for f in $files; do
  cat $f
  rm $f
done
EOF
shellcheck /tmp/bad.sh | tee /tmp/bad-sc.txt
wc -l /tmp/bad-sc.txt
```

Запишите **3 кода SC** из вывода (например SC2086, SC2164, SC2145).

---

## Задание 2. Исправленная версия

```bash
cat > /tmp/good.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /tmp || exit 1
files=${1:-}
[[ -n "$files" ]] || { echo "usage: $0 files..." >&2; exit 1; }
for f in $files; do
  [[ -f "$f" ]] || continue
  cat -- "$f"
done
EOF
shellcheck /tmp/good.sh
echo "shellcheck exit=$?"
```

**Ожидание:** exit 0, нет errors.

---

## Задание 3. Сравнение

```bash
diff -u /tmp/bad.sh /tmp/good.sh | head -30
```

Отметьте: shebang, set, кавычки, `cd || exit`.

---

## Задание 4. examples из репозитория

Из корня repo:

```bash
shellcheck courses/linux-shell/examples/bin/*.sh
echo "exit=$?"
```

Если есть замечания — исправьте или зафиксируйте в тетради для финала.

---

## Задание 5. CI snippet

```bash
cat > /tmp/ci-shellcheck.yml <<'EOF'
lint-shell:
  stage: test
  script:
    - apt-get update && apt-get install -y shellcheck
    - shellcheck courses/linux-shell/examples/bin/*.sh
EOF
cat /tmp/ci-shellcheck.yml
```

---

## Критерии успеха

- [ ] bad.sh — ≥3 замечания shellcheck
- [ ] good.sh — shellcheck exit 0
- [ ] Знаете SC2086 (кавычки)
- [ ] examples проверены

## Что унести в работу

- pre-commit hook: `shellcheck` на staged `*.sh`.
- Не merge скриптов с shellcheck errors.

Следующий урок: [15. Healthcheck](15-healthcheck.md).
