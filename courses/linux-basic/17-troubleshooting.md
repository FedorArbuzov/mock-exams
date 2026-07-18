# 17. Troubleshooting: load, disk, permissions, сеть

## Метод, который не подводит

Паника → перезагрузка → «само прошло» оставляет вас без понимания. Рабочий порядок:

1. **Симптом** — что именно не так (HTTP 502, SSH timeout, disk full).
2. **Граница** — один хост, один сервис или вся сеть.
3. **Изменения** — деплой, конфиг, патч, cron (спросите «что менялось?»).
4. **Логи** — journal + файлы приложения **с меткой времени**.
5. **Ресурсы** — CPU, RAM, disk, FD, connections.
6. **Гипотеза → проверка** — одна правка, один тест.

Документируйте вывод команд в тикет — через неделю вы сами скажете спасибо.

## CPU и load

```bash
uptime
top -b -n 1 | head -20
ps aux --sort=-%cpu | head -10
```

**Load average** (1/5/15 мин) — сколько процессов ждут CPU или I/O. Load 20 при idle CPU часто = **диск**, не «нужно 20 ядер».

## Память и OOM

```bash
free -h
ps aux --sort=-%mem | head
dmesg -T | grep -i oom
journalctl -k | grep -i oom
```

OOM killer убивает процесс без спроса — в логах ядра будет имя жертвы.

## Диск: байты и inode

```bash
df -h
df -i
du -xhd1 /var | sort -h | tail -15
```

«No space left on device» при «есть место» — проверьте **inode** (`df -i`). Классика — миллионы мелких файлов в `/tmp` или сессиях.

## Права и путь

```bash
namei -l /var/lib/nginx/proxy/cache/some/file
ls -la /var/lib/nginx
```

«Permission denied» — владелец, группа, отсутствие `x` на каталогах в пути, позже SELinux/AppArmor.

## Сеть — различайте отказы

```bash
ss -tlnp
ping -c2 HOST
curl -v --connect-timeout 3 http://HOST/
traceroute HOST
```

| Сообщение | Частая причина |
|-----------|----------------|
| Connection refused | порт закрыт, сервис не слушает |
| Connection timed out | firewall, маршрут, хост down |
| HTTP 502/504 | upstream, не «сеть до клиента» |

## Сервисы

```bash
systemctl status nginx
journalctl -u nginx -n 80 --no-pager
nginx -t
```

Конфиг с синтаксической ошибкой — сервис не поднимется; `nginx -t` быстрее, чем гадать.

## Чек-лист инцидента

- [ ] Воспроизводится стабильно?
- [ ] Есть логи в окне времени?
- [ ] `df -h` и `df -i` в норме?
- [ ] Порт слушается (`ss -tlnp`)?
- [ ] Зафиксировано последнее изменение?

Следующий урок: [17. Лаба: диагностика](17-lab-troubleshooting.md) → затем [финальный проект](18-final-project.md).
