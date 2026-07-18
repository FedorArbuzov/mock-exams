# 09. sed — потоковый редактор

## Введение: sed -i на проде без бэкапа

Заменили `image: old` на `image: new` в YAML одной командой, без diff в MR — опечатка в pattern затронула **десять** строк. **sed** мощный, но требует дисциплины: копия файла, проверка diff, в CI — вывод в новый файл.

**sed** обрабатывает поток **построчно** — удобен для конфигов и логов на серверах без Python.

## Что вы узнаете

- Команда **`s///`** и флаги **`g`**, **`i`**.
- **`-i.bak`**, безопасный in-place.
- Удаление строк, печать диапазона **`-n`**.
- Несколько выражений **`-e`**.
- **`-E`** и группы. Ограничения BSD vs GNU.

---

## Форма

```text
sed [опции] 'команда' файл
sed -f script.sed файл
```

---

## Замена s///

```bash
sed 's/old/new/' file           # первая замена в строке
sed 's/old/new/g' file          # все в строке
sed 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' file
```

Другой разделитель (если пути с `/`):

```bash
sed 's|/var/www|/var/www/v2|g' file
```

---

## In-place

```bash
sed -i 's/debug/info/' app.conf
sed -i.bak 's/debug/info/' app.conf    # остаётся app.conf.bak
```

В CI безопаснее:

```bash
sed 's/pattern/replace/g' input > output
diff -u input output
mv output input
```

---

## Удаление и выборка

```bash
sed '/^$/d' file                 # пустые строки
sed '/^#/d' file                 # комментарии
sed -n '1,10p' file             # только строки 1–10
sed -n '/error/p' log.txt        # строки с error
```

---

## Несколько команд

```bash
sed -e 's/foo/bar/g' -e '/^$/d' file
sed 's/a/A/; s/b/B/' file
```

---

## Расширенный regex (-E)

```bash
echo "version=1.2.3" | sed -E 's/version=([0-9.]+)/version=\1-beta/'
```

---

## Типичные ошибки

| Проблема | Решение |
|----------|---------|
| спецсимволы в pattern | экранировать `\.[]^$` |
| sed на бинарник | не делать |
| macOS BSD sed | `gsed` или Linux runner в CI |
| `-i` без бэкапа | `-i.bak` |

---

## В продакшене

Предпочитайте **шаблоны** (Ansible template, Helm) вместо ad-hoc sed на prod. sed — bootstrap, emergency fix, lab.

---

## Резюме

**sed** — замены и фильтрация строк. **`s/old/new/g`**, **`-i.bak`**, **`-n '/pat/p'`**. Всегда смотрите **diff** после замены.

## Чек-лист

- [ ] Чем `s/a/b/` отличается от `s/a/b/g`?
- [ ] Зачем `-i.bak`?
- [ ] Как вывести только строки с ERROR?

Следующий урок: [10. Лаба: sed](10-lab-sed.md).
