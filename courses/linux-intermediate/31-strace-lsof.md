# 31. strace и lsof

## Введение: в логах пусто, а процесс «не стартует»

Приложение завершается с кодом 1, в journal — одна строка «Failed». **strace** показывает **системные вызовы** ядра: какой файл не открылся (`ENOENT`), куда не дошёл `connect` (`ECONNREFUSED`), какой конфиг искали первым.

**lsof** (list open files) отвечает: **кто держит** порт 80, кто не отпускает файл при `umount: target is busy`, какой PID мешает удалить лог.

Это не замена нормальному логированию — **последний слой**, когда [ss/curl](11-network-debug.md) уже дали симптом, а причина в syscall.

## Что вы узнаете

- Когда strace уместен (кратко, staging/lab).
- Фильтры `-e trace=` и вывод в файл.
- **lsof** для портов, файлов, каталогов.
- Связка: ss → curl → strace → lsof.
- Риски на production (замедление, объём лога).

---

## strace — что это

Каждый вызов библиотеки (`open`, `read`, `connect`) в итоге становится **syscall**. strace перехватывает их и печатает аргументы и **errno**.

```bash
strace -e trace=openat,connect,read,write \
  curl -s -o /dev/null http://172.28.0.11/ 2>&1 | tail -40
```

**Успешный connect:**

```text
connect(3, {sa_family=AF_INET, sin_port=htons(80), sin_addr=inet_addr("172.28.0.11")}, 16) = 0
```

**Отказ:**

```text
connect(...) = -1 ECONNREFUSED (Connection refused)
```

| errno | Обычный смысл |
|-------|----------------|
| ENOENT | нет файла/каталога |
| EACCES | нет прав |
| ECONNREFUSED | порт не слушается |
| ETIMEDOUT | firewall, нет маршрута |

### Полезные ключи

| Ключ | Смысл |
|------|--------|
| `-f` | следовать за fork (дочерние процессы) |
| `-e trace=file` | только open/openat |
| `-e trace=network` | connect, accept, send, recv |
| `-p PID` | attach к живому процессу |
| `-o /tmp/trace.log` | писать в файл |
| `-c` | статистика по syscalls (быстрый обзор) |

```bash
strace -c sleep 1
strace -p $(pgrep -n nginx) -e trace=openat 2>&1 | head -20   # осторожно на prod
```

**Прод:** strace **замедляет** процесс; короткие сессии, фильтр `-e`, согласование. На high-QPS не вешайте `-p` надолго.

---

## lsof — открытые файлы и сокеты

```bash
sudo lsof -i :80
sudo lsof -iTCP -sTCP:LISTEN
sudo lsof -p $(pgrep -n sshd | head -1) | head -20
sudo lsof /var/log/nginx/access.log
sudo lsof +D /mnt/nfs-share
```

| Ситуация | Команда |
|----------|---------|
| Кто слушает 443? | `lsof -i :443` |
| Кто держит каталог? | `lsof +D /path` |
| Файл удалён, но место не освободилось | `lsof` покажет процесс с deleted inode |

`umount: target is busy` → `cd /`, `lsof +D /mnt/...`, остановить сервис или закрыть fd.

**Без sudo** lsof не видит чужие процессы — для полной картины нужен root.

---

## Сценарий диагностики (runbook)

Проблема: **curl http://172.28.0.11/ падает**

| Шаг | Инструмент | Вопрос |
|-----|------------|--------|
| 1 | `ping`, `ip route get` | L3 OK? |
| 2 | `ss -tlnp` на srv1 | слушается :80? |
| 3 | `curl -v` | refused vs timeout? |
| 4 | `strace -e connect curl ...` | syscall подтверждает? |
| 5 | `lsof -i :80` | не занят ли порт другим процессом? |

---

## strace vs логи приложения

| | app logs | strace |
|---|----------|--------|
| Видит бизнес-логику | да | нет |
| Видит отсутствующий /etc/app.yml | только если app пишет | да, openat ENOENT |
| Нагрузка | низкая | высокая |
| Секреты в выводе | возможно | возможно (env, paths) |

Не отправляйте полный trace с prod в публичный тикет.

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| strace без `-e` на busy host | гигабайт за секунды |
| lsof без sudo | «порт свободен», а занят |
| игнор EACCES | думать «файла нет», а права/AppArmor |
| strace на sshd под нагрузкой | лаги для всех SSH |

---

## В продакшене

**eBPF** (bpftrace, bcc), APM, distributed tracing. strace — **last resort** на node/pod при «молчаливом» exit. lsof — перед umount, при «address already in use».

---

## Резюме

**strace** — syscalls и errno. **lsof** — открытые файлы и сокеты. Вместе закрывают сбои без логов. Всегда фильтруйте и ограничивайте время.

## Чек-лист

- [ ] Как увидеть failed connect в strace?
- [ ] Чем ENOENT отличается от EACCES?
- [ ] Как найти PID на :443?
- [ ] Что делать при umount busy?

Следующий урок: [32. Лаба: strace](32-lab-strace.md).
