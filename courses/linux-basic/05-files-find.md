# 05. find, locate, stat

## Когда что искать

На проде вас спросят: «найди все логи старше 30 дней», «кто съел inode», «почему этот файл root:root». Для **точных** условий по дереву каталогов — **`find`**. Для «где вообще лежит nginx.conf на диске» быстрее **`locate`** (если индекс свежий). Для одного файла — **`stat`**: права, размер, три времени.

## find — обход дерева с условиями

`find` **сам** обходит каталоги; это не поиск по индексу. Медленнее на огромных `/`, но всегда актуально.

```bash
find /etc -name "*.conf" -type f 2>/dev/null | head
find /var/log -type f -mtime -1
find /home -user course -type f 2>/dev/null
find /var -size +100M -type f 2>/dev/null | head
```

| Предикат | Значение |
|----------|----------|
| `-name 'pattern'` | имя (shell glob) |
| `-iname 'pattern'` | без учёта регистра |
| `-type f` / `-type d` | только файлы / каталоги |
| `-mtime -N` | изменён **менее** N×24 ч назад |
| `-mtime +N` | изменён **более** N дней назад |
| `-user NAME` | владелец |
| `-size +10M` | больше 10 мегабайт |

`2>/dev/null` прячет «Permission denied» при обходе `/etc` без root — иначе вывод забьёт ошибками.

### Действия: не только печатать путь

```bash
find /tmp -name "lab-*.tmp" -mtime +0 -print
find /var/log -name "*.gz" -mtime +30 -delete    # осторожно в проде!
find /etc/nginx -name "*.conf" -exec ls -lh {} \;
find /srv -type f -name "*.log" -exec chmod 640 {} \;
```

`-exec cmd {} \;` — запуск **для каждого** найденного; `{}` заменяется путём. Вариант `+` объединяет аргументы (быстрее): `-exec ls -lh {} +`.

**Правило безопасности:** сначала запускайте find **без** `-delete`, с `-print`, убедитесь в списке.

## stat — метаданные одного объекта

```bash
stat /etc/passwd
stat -c '%a %U %G %n' /etc/passwd
stat -c '%s bytes %n' /var/log/syslog
```

Полезные поля:

| Время | Смысл |
|-------|--------|
| Access (atime) | последнее чтение |
| Modify (mtime) | изменение **содержимого** |
| Change (ctime) | изменение метаданных (права, owner) |

При расследовании «кто трогал конфиг» смотрят mtime/ctime; atime на современных системах часто отключён (`relatime`).

## locate / plocate — поиск по индексу

```bash
sudo apt install -y plocate
sudo updatedb
locate nginx.conf
locate -i readme.md | head
```

Индекс обновляет cron (обычно раз в сутки). **Новый** файл после деплоя может не найтись, пока не выполните `sudo updatedb`.

| Задача | Инструмент |
|--------|------------|
| «Все .log > 1 ГБ в /var» | find |
| «Где лежит binary postgres» | locate (после updatedb) |
| Права и inode одного пути | stat |

## Связь с инцидентами

- Диск забит: `find /var -xdev -type f -size +500M`
- Подозрительный SUID: `find / -perm -4000 -type f 2>/dev/null`
- Файлы, изменённые за час: `find /etc -type f -mmin -60`

Подробнее про `du` и диски — [17](17-troubleshooting.md).

## Чек-лист

- Чем `find` принципиально отличается от `locate`?
- Что означает `-mtime -1`?
- Зачем сначала `-print`, потом `-delete`?
- Какая разница между mtime и ctime?

Следующий урок: [05. Лаба: find](05-lab-find.md).
