# 05. Лаба: find, stat, locate

Научитесь **безопасно** искать файлы: сначала смотреть список, потом действовать. В проде одна опечатка в `find ... -delete` — бэкап на восстановление.

## Стенд

`docker compose exec lab bash`

---

## Задание 1. find по имени и типу

```bash
find /etc -name "hosts" -type f 2>/dev/null
find /etc -name "*.conf" -type f 2>/dev/null | wc -l
```

**Что увидите:** точный путь к `hosts` и большое число `.conf` (число зависит от образа).

Сузьте поиск:

```bash
find /etc/nginx -name "*.conf" -type f 2>/dev/null
```

Если nginx не установлен — каталог пуст или find ничего не вернёт; установите `sudo apt install -y nginx` или ищите в `/etc/ssh`.

---

## Задание 2. По времени и размеру

```bash
find /var/log -type f -mtime -1 2>/dev/null | head
find /var/log -type f -size +1M 2>/dev/null | head
```

**Что увидите:** недавние и «тяжёлые» логи — кандидаты на ротацию при «диск полон».

---

## Задание 3. stat

```bash
stat /etc/passwd
stat -c 'mode=%a owner=%U group=%G file=%n' /etc/passwd
```

Создайте файл и сравните времена:

```bash
touch /tmp/find-lab-demo
sleep 1
echo x >> /tmp/find-lab-demo
stat /tmp/find-lab-demo
```

**Что увидите:** mtime изменился после записи в файл.

---

## Задание 4. -exec без удаления

```bash
find /tmp -maxdepth 1 -name "find-lab-*" -type f 2>/dev/null
find /tmp -maxdepth 1 -name "find-lab-*" -type f -exec ls -lh {} \;
```

Создайте пару файлов для демо:

```bash
touch /tmp/find-lab-{a,b,c}
find /tmp -maxdepth 1 -name "find-lab-*" -exec ls -lh {} \;
```

---

## Задание 5. locate (если установлен plocate)

```bash
sudo apt install -y plocate
sudo updatedb
locate passwd | head
locate -i sshd_config
```

**Что увидите:** много путей с `passwd` — индекс ищет по **подстроке** имени.

Сравните с find:

```bash
find /etc -name "sshd_config" 2>/dev/null
```

---

## Задание 6. «Сухой прогон» перед delete

```bash
touch /tmp/find-lab-old
find /tmp -maxdepth 1 -name "find-lab-old" -print
# только когда уверены:
find /tmp -maxdepth 1 -name "find-lab-old" -delete
find /tmp -maxdepth 1 -name "find-lab-old"
```

---

## Уборка

```bash
rm -f /tmp/find-lab-* /tmp/find-lab-demo
```

---

## Критерии успеха

- [ ] find по `/etc` с `2>/dev/null` отработал
- [ ] stat показал права и владельца
- [ ] `-exec ls` вывел список созданных файлов
- [ ] Понимаете, зачем сначала `-print`, потом `-delete`

Следующий урок: [06. grep и awk](06-text-tools.md).
