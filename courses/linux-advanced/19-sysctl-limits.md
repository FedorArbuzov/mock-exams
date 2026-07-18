# 19. sysctl и limits.conf

## Введение: «Too many open files» при 500 RPS

Nginx в логах: `24: Too many open files`. `ulimit -n` в shell — 1024, в unit nginx — default 1024, а соединений тысячи. Два механизма: **sysctl** (параметры **ядра**) и **limits** (per-user/process).

Путаница между **limits.conf** и **systemd LimitNOFILE** — частая причина «мы подняли ulimit, сервис всё равно 1024».

## Что вы узнаете

- **sysctl** runtime и `/etc/sysctl.d/`.
- **limits.conf** и PAM session.
- **systemd** `LimitNOFILE`, `LimitNPROC`.
- Что проверять при инциденте.

---

## sysctl — параметры ядра

```bash
sysctl net.ipv4.ip_forward
sysctl net.core.somaxconn
sudo sysctl -w net.core.somaxconn=4096
```

Persist:

```bash
echo 'net.core.somaxconn = 4096' | sudo tee /etc/sysctl.d/99-app.conf
sudo sysctl --system
```

| Параметр | Смысл |
|----------|--------|
| `net.core.somaxconn` | очередь listen backlog |
| `net.ipv4.ip_local_port_range` | эфемерные порты |
| `fs.file-max` | глобальный лимит открытых файлов в ядре |
| `vm.swappiness` | склонность к swap |

Связь с [K8s node prep](07-k8s-node-prep.md) и [linux-intermediate performance](../linux-intermediate/29-performance.md).

---

## limits.conf

`/etc/security/limits.conf`:

```text
nginx soft nofile 65535
nginx hard nofile 65535
*    soft    nproc   4096
*    hard    nproc   4096
```

Проверка **интерактивной** сессии:

```bash
ulimit -n
ulimit -u
```

**Важно:** для **systemd-сервисов** limits.conf может **не применяться** — используйте drop-in unit.

---

## systemd overrides (предпочтительно для сервисов)

```ini
# /etc/systemd/system/nginx.service.d/limits.conf
[Service]
LimitNOFILE=65535
LimitNPROC=4096
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart nginx
systemctl show nginx -p LimitNOFILE --value
cat /proc/$(pgrep -o nginx)/limits | grep "open files"
```

| Источник | Кому |
|----------|------|
| limits.conf + PAM | login ssh, su |
| systemd unit | daemons |

---

## Диагностика

```bash
cat /proc/PID/limits
grep "open files" /proc/PID/limits
ls /proc/PID/fd | wc -l
```

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| ulimit высокий, nginx 1024 | не systemd drop-in |
| somaxconn низкий | sysctl |
| file-max исчерпан | ядро, leak |
| * soft nofile в limits | не для всех сервисов |

---

## В продакшене

Единый baseline в Ansible: `sysctl.d` + `systemd` drop-ins. Документировать требования приложения (Elasticsearch, Kafka — огромные nofile).

---

## Резюме

**sysctl** — ядро, **/etc/sysctl.d/**. Сервисы — **LimitNOFILE** в systemd. **ulimit** в shell — не доказательство для nginx.

## Чек-лист

- [ ] Где persist sysctl?
- [ ] Чем ulimit отличается от LimitNOFILE?
- [ ] Как проверить лимит **процесса** nginx?

Следующий урок: [20. Лаба: limits](20-lab-limits.md).
