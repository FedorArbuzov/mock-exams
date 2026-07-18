# 12. Лаба: отчёт по логам awk

## Цель лабы

Собрать **`/tmp/awk-report.txt`**: диски, порты, счётчики error/warn из journal — закрепить **-F**, **NR**, **END**, **printf**.

## Предварительно

- [11. awk](11-awk.md).
- lab.

```bash
docker compose exec lab bash
```

---

## Задание 1. Топ UID

```bash
awk -F: '{print $3, $1}' /etc/passwd | sort -n | tail -5
```

---

## Задание 2. df — заполнение > 50%

```bash
df -h | awk 'NR>1 {
  gsub(/%/,"",$5)
  if ($5+0 > 50) print $1, $5"%", $6
}'
```

**Если пусто:** на lab диски часто < 50% — норма.

---

## Задание 3. journal — счётчики

```bash
journalctl --no-pager -n 2000 2>/dev/null | awk '
tolower($0) ~ /error/  { e++ }
tolower($0) ~ /warn/   { w++ }
END { printf "errors=%d warnings=%d lines scanned\n", e+0, w+0 }
'
```

---

## Задание 4. ss — порты (топ)

```bash
ss -tlnp 2>/dev/null | awk 'NR>1 {print $4}' | sed 's/.*://' | sort -n | uniq -c | sort -rn | head -10
```

---

## Задание 5. Сводный отчёт

```bash
{
  echo "# Lab awk report $(date -Iseconds)"
  echo "## Disk (>30% used)"
  df -h | awk 'NR>1 {gsub(/%/,"",$5); if ($5+0>30) printf "%-20s %5s %s\n", $1, $5"%", $6}'
  echo "## Listen ports (sample)"
  ss -tlnp 2>/dev/null | awk 'NR>1 {print $4}' | head -8
  echo "## Journal summary (last 2000 lines)"
  journalctl --no-pager -n 2000 2>/dev/null | awk '
    tolower($0) ~ /error/ { e++ }
    tolower($0) ~ /warn/  { w++ }
    END { printf "errors=%d warnings=%d\n", e+0, w+0 }
  '
} > /tmp/awk-report.txt
cat /tmp/awk-report.txt
wc -l /tmp/awk-report.txt
```

---

## Задание 6. passwd в колонках (printf)

```bash
awk -F: 'BEGIN {print "USER UID HOME"}
  {printf "%-12s %6s %s\n", $1, $3, $6}' /etc/passwd | head -8
```

---

## Критерии успеха

- [ ] `/tmp/awk-report.txt` создан, ≥ 10 строк
- [ ] journal awk вывел errors/warnings
- [ ] Использованы -F, NR, END, gsub
- [ ] Понимаете `$5+0` для чисел

## Что унести в работу

- log-report.sh в финале — тот же паттерн END.
- Всегда проверяйте поле на **одной** строке лога.

Следующий урок: [13. shellcheck](13-shellcheck.md).
