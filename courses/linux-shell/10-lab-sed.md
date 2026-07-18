# 10. Лаба: sed для конфигов

## Цель лабы

Отработать **замену**, **удаление** строк и **in-place с бэкапом** на копии `/etc/hosts` и (опционально) `nginx.conf` — без поломки prod-файлов.

## Предварительно

- [09. sed](09-sed.md).
- lab.

```bash
docker compose exec lab bash
```

---

## Подготовка

```bash
cp /etc/hosts /tmp/hosts.lab
wc -l /tmp/hosts.lab
```

---

## Задание 1. Раскомментировать строку (если есть)

```bash
grep -n 'srv1\|lab' /tmp/hosts.lab || echo "add test line:"
echo "172.28.0.11 srv1.lab.local srv1" >> /tmp/hosts.lab
sed 's/^#\(.*srv1.lab.local\)/\1/' /tmp/hosts.lab > /tmp/hosts.lab2
mv /tmp/hosts.lab2 /tmp/hosts.lab
grep srv1 /tmp/hosts.lab
```

---

## Задание 2. Удалить пустые строки

```bash
sed '/^$/d' /tmp/hosts.lab | wc -l
```

---

## Задание 3. Удалить комментарии (кроме localhost block — осторожно)

```bash
sed '/^#/d' /tmp/hosts.lab | head -15
```

**Зачем:** увидеть «голые» записи; на prod так не делайте без review.

---

## Задание 4. nginx worker_processes (с бэкапом)

```bash
sudo apt install -y nginx 2>/dev/null || true
grep worker_processes /etc/nginx/nginx.conf
sudo cp /etc/nginx/nginx.conf /tmp/nginx.conf.bak
sudo sed -i 's/worker_processes auto/worker_processes 2/' /etc/nginx/nginx.conf
grep worker_processes /etc/nginx/nginx.conf
sudo nginx -t
sudo cp /tmp/nginx.conf.bak /etc/nginx/nginx.conf
sudo nginx -t
```

---

## Задание 5. Несколько -e

```bash
echo -e "debug\ninfo\nerror\n" | sed -e 's/debug/DEBUG/' -e 's/error/ERROR/'
```

---

## Задание 6. diff до/после (дисциплина)

```bash
cp /etc/hosts /tmp/hosts.before
sed 's/localhost/localhost.localdomain/' /tmp/hosts.before > /tmp/hosts.after
diff -u /tmp/hosts.before /tmp/hosts.after | head -20
```

---

## Критерии успеха

- [ ] sed изменил копию hosts
- [ ] nginx.conf восстановлен из .bak
- [ ] Понимаете -e, -i, diff
- [ ] Несколько выражений в одном sed

## Что унести в работу

- Любой `sed -i` на сервере → бэкап + `nginx -t` / reload только после OK.

Следующий урок: [11. awk](11-awk.md).
