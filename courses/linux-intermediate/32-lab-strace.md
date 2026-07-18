# 32. Лаба: strace и lsof

## Цель лабы

Увидеть **системные вызовы**, которые скрыты за привычными командами: `curl` → `connect`, `cat` → `openat` + **ENOENT**, `sshd` → слушает сокет. Это последний слой диагностики, когда логов приложения нет, а `curl` уже показал refused/timeout.

## Предварительно

- [31. strace и lsof](31-strace-lsof.md).
- Стенд Up, **srv1** `172.28.0.11` пингуется с lab.
- Пакеты: `strace`, `lsof`.

```bash
docker compose exec lab bash
ping -c1 172.28.0.11
which strace lsof
sudo apt install -y strace lsof
```

Если nginx на srv1 не установлен — задание 1 можно выполнить на **порт 22** (задание 1b).

---

## Подготовка стенда

```bash
curl -s -o /dev/null -w "srv1:80 %{http_code}\n" http://172.28.0.11/ 2>/dev/null || echo "port 80 not available — use SSH in 1b"
```

---

## Задание 1. strace curl (HTTP)

**Зачем:** доказать, к какому IP:port ушёл connect.

```bash
strace -e trace=connect,openat,read,write \
  curl -s -o /dev/null http://172.28.0.11/ 2>&1 | tail -30
```

**Что увидите (пример успеха):**

```text
connect(3, {sa_family=AF_INET, sin_port=htons(80), sin_addr=inet_addr("172.28.0.11")}, 16) = 0
```

| Хвост `connect(...)` | Смысл |
|----------------------|--------|
| `= 0` | TCP установлен |
| `= -1 ECONNREFUSED` | порт закрыт / нет listen |
| `= -1 ETIMEDOUT` | firewall, нет маршрута |

**Если curl: (7) Failed to connect:** сначала [11-network-debug](11-network-debug.md); strace подтверждает слой L4.

---

## Задание 1b. strace SSH (если :80 недоступен)

```bash
strace -e trace=connect ssh -o ConnectTimeout=3 -o BatchMode=yes course@172.28.0.11 true 2>&1 | grep connect
```

Порт **22**, не 80.

---

## Задание 2. ENOENT — файл не найден

**Зачем:** отличить «нет прав» от «нет файла».

```bash
strace -e trace=openat cat /nonexistent-file-xyz 2>&1 | tail -8
```

**Ожидается:**

```text
openat(AT_FDCWD, "/nonexistent-file-xyz", O_RDONLY) = -1 ENOENT (No such file or directory)
```

**EACCES** было бы «файл есть, прав нет».

---

## Задание 3. lsof — кто слушает :22

```bash
sudo lsof -i :22 | head -10
ss -tlnp | grep ':22'
```

**Что увидите:** процесс **sshd** и состояние LISTEN.

**Сравнение:** `ss` быстрее для «кто на порту»; `lsof` удобен для **файлов** и «кто держит файл открытым».

---

## Задание 4. Удержание файла

**Зачем:** перед `umount` и при «device busy».

```bash
exec 9>/tmp/lab-lsof-hold
echo data >&9
sudo lsof /tmp/lab-lsof-hold
exec 9>&-
rm -f /tmp/lab-lsof-hold
```

Пока fd 9 открыт, `lsof` показывает ваш shell.

---

## Задание 5. Запись trace в файл

**Зачем:** на проде разбирают офлайн; не снимайте trace с секретами в общий чат.

```bash
strace -o /tmp/trace-curl.log -e trace=network,openat \
  curl -s -o /dev/null http://172.28.0.11/ 2>/dev/null
wc -l /tmp/trace-curl.log
grep -E 'connect|openat' /tmp/trace-curl.log | head -15
rm -f /tmp/trace-curl.log
```

---

## Задание 6. strace на живой PID (опционально, осторожно)

Только в lab, несколько секунд:

```bash
PID=$(pgrep -n sshd)
sudo timeout 3 strace -p "$PID" -e trace=read,write 2>&1 | head -20
```

На prod `-p` на sshd под нагрузкой может тормозить — не делайте без необходимости.

---

## Критерии успеха

- [ ] В strace виден `connect` к 172.28.0.11:80 или :22
- [ ] Показан `ENOENT` для несуществующего файла
- [ ] `lsof -i :22` нашёл sshd
- [ ] Понимаете разницу ENOENT vs EACCES

## Что унести в работу

- **strace** — «почему не открылось / не подключилось», когда логов нет.
- **lsof** — перед `umount`, при «address already in use», утечки fd.
- Фильтруйте `-e trace=`; на prod ограничивайте время и объём.

Следующий урок: [33. Backup](33-backup-strategy.md).
