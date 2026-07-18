# 06. grep, cut, sort, uniq, awk

## Зачем целый урок про «текстовые» утилиты

Логи — это текст. Метрики в CLI — таблицы. `/etc/passwd` — колонки через `:`. DevOps-инженер **не** читает гигабайт глазами: он режет, фильтрует, считает. Те же приёмы работают в jump-хосте, в `kubectl logs`, в CI job.

Углублённый awk/sed — [`linux-shell`](../linux-shell/README.md). Здесь — рабочий минимум на каждый день.

## grep — найти строки по шаблону

```bash
grep "error" /var/log/syslog 2>/dev/null
grep -i failed /var/log/auth.log 2>/dev/null
grep -rn "server_name" /etc/nginx/ 2>/dev/null
grep -c "^#" /etc/ssh/sshd_config
grep -E "ssh|sudo" /var/log/auth.log 2>/dev/null | tail
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
```

| Ключ | Эффект |
|------|--------|
| `-i` | без учёта регистра |
| `-r` | рекурсивно по каталогу |
| `-n` | номер строки |
| `-c` | только количество совпадений |
| `-v` | инверсия — строки **без** шаблона |
| `-E` | расширенные regex (`|`, `+`, `?`) |
| `-F` | фиксированная строка (не regex) |

**Совет:** в логах сначала `tail -100`, потом `grep`, иначе вы утопите терминал.

## cut — вырезать колонки

```bash
cut -d: -f1 /etc/passwd | head
cut -d: -f1,6 /etc/passwd | head
df -h | tr -s ' ' | cut -d' ' -f1,5
```

`-d` — разделитель, `-f` — номера полей. Для пробельных таблиц часто сначала `tr -s ' '` сжимает пробелы.

## sort и uniq — частоты и топы

```bash
cut -d: -f1 /etc/passwd | sort | uniq -c | sort -rn | head
```

`uniq` убирает только **подряд идущие** дубликаты. Без `sort` перед `uniq` результат будет неверным — классическая ловушка.

## wc — быстрый счёт

```bash
wc -l /etc/passwd
journalctl --no-pager -u ssh 2>/dev/null | wc -l
```

## awk — когда cut мало

```bash
awk -F: '{print $1, $3, $6}' /etc/passwd | head
awk '/error|fail/i {print $0}' /var/log/syslog 2>/dev/null | tail
awk '{sum+=$1} END {print "total:", sum}' numbers.txt
```

`-F:` — поле-разделитель. `$1`, `$2`, … `$NF` — последнее поле. Блок `END` выполняется после всех строк — удобно для сумм.

## Типичные pipeline для инцидента

```bash
# неудачные SSH
journalctl -u ssh --no-pager 2>/dev/null | grep -i "Failed password" | tail -20

# топ IP в access.log (если nginx есть)
awk '{print $1}' /var/log/nginx/access.log 2>/dev/null | sort | uniq -c | sort -rn | head

# активные конфиги ssh без комментариев
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
```

## Ошибки новичков

- `grep pattern` без файла — ждёт stdin; в скрипте забудут pipe.
- Regex со скобками без `-E` — «не находит».
- `uniq` без `sort` — «уникальных» слишком много.

## Чек-лист

- Зачем перед `uniq` почти всегда нужен `sort`?
- Как вывести только непустые не-комментарии из конфига?
- Как через awk вывести login и home из `/etc/passwd`?

Следующий урок: [06. Лаба: логи](06-lab-grep.md).
