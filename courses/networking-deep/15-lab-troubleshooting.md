# 15. Лаба: диагностика пути на deploy/linux

## Цель

Отработать метод из [главы 13](13-troubleshooting.md): L3 → L4 → L7 → policy на стенде [`deploy/linux`](../../deploy/linux/README.md). Время: **60–90 минут**.

## Предварительно

- Пройдены [linux-intermediate/11–12](../linux-intermediate/11-network-debug.md)
- Стенд запущен:

```bash
cd deploy/linux
docker compose up -d
docker compose exec lab ping -c1 172.28.0.11
```

## Сценарии

Инструктор (или вы сами) **ломает** конфигурацию на `srv1` (`172.28.0.11`). Ваша задача — найти слой и исправить. Записывайте **команды и вывод** в конспект.

### Сценарий A — «Connection refused»

**Симптом** с `lab`:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://172.28.0.11/ || true
```

Ожидаемое поведение после починки: HTTP `200`.

**Подсказки для поломки** (если тренируетесь сами на srv1):

```bash
docker compose exec srv1 bash
# nginx слушает только localhost
sed -i 's/listen 80;/listen 127.0.0.1:80;/' /etc/nginx/sites-enabled/default
systemctl reload nginx
```

**Диагностика:**

```bash
ip route get 172.28.0.11
nc -zv 172.28.0.11 80
docker compose exec srv1 ss -tlnp | grep ':80'
```

**Слой:** L4 bind.

---

### Сценарий B — «Connection timed out»

**Поломка** (на srv1, root):

```bash
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0 \; policy accept \; }
nft add rule inet filter input ip saddr 172.28.0.10 tcp dport 80 drop
```

**Диагностика:**

```bash
curl -v --connect-timeout 3 http://172.28.0.11/
docker compose exec srv1 nft list ruleset
docker compose exec srv1 tcpdump -i eth0 -nn host 172.28.0.10 and port 80 -c 5
```

**Слой:** policy (host firewall). **Не** чините открытием всего — точечное правило или удаление rule.

---

### Сценарий C — «Работает по IP, не по имени»

**Поломка:** сломать DNS на `lab` или ответ для `app.lab.local`.

```bash
# на lab — временно неверный resolver в /etc/resolv.conf (сохраните backup)
docker compose exec lab bash -c 'cp /etc/resolv.conf /tmp/resolv.bak; echo nameserver 127.0.0.1 > /etc/resolv.conf'
```

**Проверка:**

```bash
dig @172.28.0.53 app.lab.local +short
curl -v http://app.lab.local/
curl -v http://172.28.0.20/
```

**Слой:** L7 DNS (не L3 к web).

---

### Сценарий D — «Маршрут не туда» (опционально)

Добавьте на `lab` ложный маршрут:

```bash
docker compose exec lab ip route add 172.28.0.11/32 via 172.28.0.99
```

```bash
ip route get 172.28.0.11
ping -c1 172.28.0.11
```

**Слой:** L3. Удалите маршрут после:

```bash
docker compose exec lab ip route del 172.28.0.11/32 via 172.28.0.99
```

---

## Отчёт (deliverable)

Одна страница на сценарий:

| Поле | Значение |
|------|----------|
| Симптом | refused / timeout / DNS |
| Слой | L3 / L4 / L7 / policy |
| Команда-доказательство | например `ss`, `nft`, `dig` |
| Fix | что изменили |
| Время до root cause | мин |

---

## Сброс стенда

```bash
cd deploy/linux
docker compose restart srv1 lab
# или полный reset:
docker compose down -v && docker compose up -d
```

---

## Чек-лист

- [ ] Не перескакивали сразу на tcpdump без `ip route get` и `ss`.
- [ ] Различили refused и timeout на живых примерах.
- [ ] Восстановили стенд после экспериментов.

**Дальше:** [16. Синтез](16-synthesis.md).
