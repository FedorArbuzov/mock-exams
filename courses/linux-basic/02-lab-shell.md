# 02. Лаба: shell и перенаправление

В этой лабе вы не «учите команды наизусть», а **привыкаете смотреть на потоки**: что ушло в файл, что осталось на экране, что отфильтровал pipe. Так же вы будете разбирать сломанный деплой: лог в stdout, ошибка в stderr, в pipe — пусто, потому что первая команда упала.

## Стенд

[`deploy/linux`](../../deploy/linux/README.md) — из каталога `deploy/linux`:

```bash
docker compose up -d
docker compose exec lab bash
```

Дальше все команды — **внутри** контейнера lab, если не сказано иное.

---

## Задание 1. PATH и поиск команд

Поймите, откуда bash берёт `systemctl` и почему «случайный» бинарник в текущей папке не запускается без `./`.

```bash
echo $PATH
which bash
which systemctl
type cd
type ls
```

**Что увидите:** длинную строку PATH с разделителем `:`; полные пути к `bash` и `systemctl`; `cd` помечен как shell builtin, `ls` — как файл в `/usr/bin`.

**Если `which systemctl` пусто** — в образе lab может не быть полного systemd CLI с хоста; достаточно убедиться, что `which bash` находит `/bin/bash` или `/usr/bin/bash`.

---

## Задание 2. Разделить stdout и stderr

Создайте осознанно **два** файла: успешный вывод и ошибки.

```bash
cd /tmp
rm -f lab-out.txt lab-err.txt lab-out2.txt

ls /etc > lab-out.txt 2> lab-err.txt
wc -l lab-out.txt
cat lab-err.txt
```

`lab-err.txt` должен быть **пустым** — доступ к `/etc` у вас есть.

Теперь добавьте каталог, к которому нет прав:

```bash
ls /root /etc > lab-out2.txt 2>> lab-err.txt
cat lab-err.txt
head -5 lab-out2.txt
```

**Что увидите:** в `lab-err.txt` — строки про `/root` (Permission denied); в `lab-out2.txt` — начало листинга `/etc`, как будто `ls` частично отработал.

**Зачем это в проде:** скрипт бэкапа пишет список файлов в stdout, а «файл занят» — в stderr; без `2>` вы потеряете ошибки в общем логе.

---

## Задание 3. Pipe и «пустой» вывод

```bash
ss -tlnp 2>/dev/null | head -5
ss -tlnp 2>/dev/null | wc -l
```

**Что увидите:** несколько строк listening-сокетов и число строк (зависит от сервисов в контейнере).

Если `ss` ругается на права — `2>/dev/null` убирает шум; для глубокой отладки портов позже понадобится `sudo ss -tlnp`.

Попробуйте осознанно сломать pipe:

```bash
false | echo last=$?
echo "pipe status: ${PIPESTATUS[@]}"
```

**Что увидите:** `last=0`, потому что упала не последняя команда — типичная ловушка в скриптах без `set -o pipefail`.

---

## Задание 4. Переменные и glob

```bash
export LAB_ROLE=student
echo "Role: $LAB_ROLE"
unset LAB_ROLE
echo "After unset: [${LAB_ROLE:-empty}]"

echo "First logs:" /var/log/*.log 2>/dev/null | head -c 120
echo
```

**Что увидите:** подстановку переменной; после `unset` — слово `empty` из синтаксиса `:-`; список имён логов или пусто, если glob не совпал.

Не используйте `export` для секретов в учебной среде — в проде секреты из vault/CI variables, не из истории bash.

---

## Задание 5. История

```bash
history | tail -8
```

Найдите номер любой команды из списка и выполните `!N` (подставьте свой номер). Убедитесь, что команда повторилась.

---

## Критерии успеха

- [ ] Созданы `lab-out.txt` и `lab-err.txt`; ошибка доступа к `/root` попала только в err
- [ ] Pipe с `ss` и `head`/`wc` выполнен без падения shell
- [ ] Переменная `LAB_ROLE` выводится до `unset`, после — подстановка `empty`
- [ ] Понимаете разницу между `>` и `2>`

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| Файлы не в `/tmp` | Вы в lab? `pwd` |
| `lab-err.txt` не пустой после первого ls | Смотрите содержимое — возможно, предупреждения, не fatal |
| `ss` not found | `apt update && apt install -y iproute2` (в lab с sudo) |

Следующий урок: [03. Пользователи и группы](03-users-groups.md).
