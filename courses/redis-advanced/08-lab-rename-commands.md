# 08. Лаба: rename-command и ACL deny

## Цель лабы

На **отдельном** инстансе с кастомным конфигом отключить `FLUSHALL`/`DEBUG`, переименовать `CONFIG`, создать **ACL user app** с ограничением ключей — и проверить отказ опасных операций. Связать с **host firewall** ([linux-intermediate: 07-firewall](../linux-intermediate/07-firewall.md)).

## Предварительно

- [07. Security](07-security.md).
- Фрагмент: [`examples/redis-security.conf`](examples/redis-security.conf).

---

## Подготовка: контейнер с конфигом

Из корня репозитория (пути для Git Bash / Linux):

```bash
cd deploy/redis
docker compose up -d
```

Скопируйте учебный конфиг в volume или запустите второй контейнер (упрощённо — override command):

```bash
docker run -d --name redis-sec-lab -p 6381:6379 \
  -v "$(pwd)/../../courses/redis-advanced/examples/redis-security.conf:/usr/local/etc/redis/redis.conf:ro" \
  redis:7.2-alpine redis-server /usr/local/etc/redis/redis.conf
```

Если volume path на Windows не монтируется — скопируйте `redis-security.conf` в `deploy/redis/config/redis-security-lab.conf` и:

```bash
docker run -d --name redis-sec-lab -p 6381:6379 \
  -v "%cd%\config\redis-security-lab.conf:/usr/local/etc/redis/redis.conf:ro" \
  redis:7.2-alpine redis-server /usr/local/etc/redis/redis.conf
```

```bash
redis-cli -p 6381 PING
```

---

## Задание 1. Отключённые команды

```bash
redis-cli -p 6381 FLUSHALL
redis-cli -p 6381 DEBUG SEGFAULT
```

**Что увидите:** `ERR unknown command` (или аналог) — команды удалены.

---

## Задание 2. Переименованный CONFIG

```bash
redis-cli -p 6381 CONFIG GET maxmemory
redis-cli -p 6381 CONFIG_SECRET_a8f3 GET maxmemory
```

**Что увидите:** старый `CONFIG` недоступен; секретное имя работает (имя из вашего conf).

**Если не совпадает имя:** откройте `examples/redis-security.conf` и используйте ваш `rename-command`.

---

## Задание 3. ACL user `app`

```bash
redis-cli -p 6381 ACL LIST
redis-cli -u redis://app:AppLabPassword@127.0.0.1:6381 SET app:session:1 ok
redis-cli -u redis://app:AppLabPassword@127.0.0.1:6381 SET other:key fail
redis-cli -u redis://app:AppLabPassword@127.0.0.1:6381 FLUSHALL
```

**Что увидите:** `app:*` — OK; `other:*` и `FLUSHALL` — denied.

---

## Задание 4. Связь с firewall (теория + чеклист)

Прочитайте [07-firewall](../linux-intermediate/07-firewall.md) (раздел «два слоя»). Заполните таблицу для **воображаемого** prod-хоста Redis:

| Правило | ufw / SG |
|---------|----------|
| SSH | Только bastion /32 |
| Redis 6379 | Только subnet приложений |
| Cluster bus 16379 | Только между нодами Redis |
| Internet → 6379 | **Deny** |

**Вопрос для интервью:** почему `ufw deny 6379` на хосте с Docker published port может **не** защитить так, как ожидаете? (см. firewall урок — FORWARD/DNAT).

---

## Критерии успеха

- [ ] `FLUSHALL` / `DEBUG` недоступны.
- [ ] `CONFIG` только под переименованным именем.
- [ ] User `app` пишет только в `app:*`.
- [ ] Таблица firewall заполнена.

---

## Очистка

```bash
docker rm -f redis-sec-lab
```

**Дальше:** [09. Troubleshooting](09-troubleshooting.md).
