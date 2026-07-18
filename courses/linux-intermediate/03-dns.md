# 03. DNS: резолвинг и записи

## Введение: «сервер доступен по IP, по имени — нет»

В тикете пишут: «приложение не коннектится к `db.internal`». Вы с jump-хоста делаете `ping 10.0.5.42` — отвечает. `ping db.internal` — **unknown host**. Проблема не в Postgres и не в firewall: **имя не резолвится**. Или резолвится в **старый** IP после миграции — и тогда симптомы ещё коварнее.

DNS — распределённый справочник «имя → данные» (чаще IP). DevOps постоянно имеет дело с A-записями, CNAME, TTL, внутренними зонами и с тем, **в каком порядке** ваша ОС спрашивает hosts, кэш и серверы.

## Что вы узнаете

- Порядок резолвинга: **/etc/hosts** → **nsswitch** → **stub resolver** → серверы DNS.
- Типы записей **A, AAAA, CNAME, MX, TXT** и когда что использовать.
- Как спросить конкретный DNS-сервер через **dig**.
- Где в стенде живёт зона **lab.local** (контейнер dns).
- Как отличить NXDOMAIN, timeout и «кэш со старым IP».

## Цепочка резолвинга на Linux

```mermaid
flowchart LR
  App[Application curl ssh]
  NSS[nsswitch hosts]
  Files[/etc/hosts]
  Resolver[systemd-resolved or resolv.conf]
  DNS[DNS server 53]
  App --> NSS
  NSS --> Files
  NSS --> Resolver
  Resolver --> DNS
```

1. Приложение вызывает `getaddrinfo("srv1.lab.local")`.
2. **nsswitch** (`/etc/nsswitch.conf`, строка `hosts:`) задаёт порядок, обычно `files dns`.
3. **files** — смотрим `/etc/hosts`; если имя найдено — ответ готов.
4. **dns** — запрос к резолверу (часто 127.0.0.53 → systemd-resolved, или напрямую из `/etc/resolv.conf`).
5. Резолвер спрашивает upstream DNS (корпоративный, 8.8.8.8, или **172.28.0.53** в нашем стенде).

Проверка на lab:

```bash
grep '^hosts:' /etc/nsswitch.conf
resolvectl status 2>/dev/null || cat /etc/resolv.conf
getent hosts srv1.lab.local
```

`getent` проходит **ту же** цепочку, что и приложения — удобно для отладки.

## /etc/hosts — локальные переопределения

```text
127.0.0.1       localhost
172.28.0.11     srv1.lab.local srv1
172.28.0.20     web.lab.local web
```

Плюсы: работает без DNS, мгновенно для лаб. Минусы: не масштабируется, легко рассинхронить с реальностью. В проде hosts — редко, кроме break-glass и некоторых контейнеров.

Если в hosts есть `srv1.lab.local`, а вы правите BIND — **сначала** увидите IP из hosts, не из DNS.

## Типы записей

| Тип | Содержимое | Пример использования |
|-----|------------|----------------------|
| **A** | IPv4 | `web.lab.local → 172.28.0.20` |
| **AAAA** | IPv6 | dual-stack сайты |
| **CNAME** | алиас на другое имя | `www` → `lb.example.com` |
| **MX** | почтовый сервер | приоритет + hostname |
| **TXT** | произвольный текст | SPF, DKIM, верификация |

**CNAME** на «apex» домена (голый `example.com`) часто нельзя — используют A или ALIAS у DNS-провайдера.

**TTL** (time to live) — сколько секунд кэшировать ответ. Низкий TTL перед миграцией — меньше клиентов со старым IP, больше нагрузка на DNS.

## dig и host — спросить сервер явно

```bash
dig srv1.lab.local @172.28.0.53 +short
dig @172.28.0.53 web.lab.local A
dig @172.28.0.53 srv1.lab.local ANY
host srv1.lab.local 172.28.0.53
```

`@172.28.0.53` — **игнорировать** кэш и resolv.conf, идти прямо на BIND в стенде. Без `@` — пойдёт в то, что в `resolv.conf`.

Обратный DNS (IP → имя):

```bash
dig -x 172.28.0.11 @172.28.0.53 +short
```

## Зона lab.local в стенде

Контейнер **dns** — **172.28.0.53**. Файлы зоны — в [`deploy/linux/bind`](../../deploy/linux/bind/). После `docker compose up` записи `srv1.lab.local`, `web.lab.local` должны отвечать с этого IP.

Проверка с lab:

```bash
dig @172.28.0.53 srv1.lab.local +short
dig @172.28.0.53 web.lab.local +short
```

## Типичные ошибки

| Симптом | Причина | Действие |
|---------|---------|----------|
| NXDOMAIN | имени нет в зоне | опечатка, wrong zone |
| SERVFAIL | ошибка на сервере DNS | логи BIND, синтаксис zone |
| timeout | сеть, fw на 53/udp | `ping 172.28.0.53`, ufw |
| «Старый» IP | TTL, кэш | `resolvectl flush-caches`, подождать TTL |
| hosts «перебивает» DNS | порядок files dns | `grep srv1 /etc/hosts` |

## Практический пример на стенде

С **lab** выполните полный цикл (подробнее в [лабе 04](04-lab-dns.md)):

```bash
# 1. Прямо на authoritative DNS стенда
dig @172.28.0.53 srv1.lab.local +short

# 2. Через системный резолвер (может отличаться!)
dig srv1.lab.local +short

# 3. То же, что видит приложение
getent hosts srv1.lab.local
```

Если (1) и (2) **разные** — смотрите `/etc/hosts`, `resolv.conf`, кэш resolved. Это классический баг после миграции: BIND уже обновлён, а один jump-host всё ещё с записью в hosts.

## Запись в зоне (для понимания BIND)

В [`deploy/linux/bind`](../../deploy/linux/bind/) лежит файл зоны. Строка в стиле:

```text
srv1    IN  A   172.28.0.11
```

означает: в зоне **lab.local** имя **srv1** → IPv4. SOA и NS записи говорят, что этот сервер **authoritative** для зоны. Менять IP srv1 — правка зоны + `rndc reload` или перезапуск BIND, не только hosts на клиенте.

## В продакшене

В Kubernetes **CoreDNS** отвечает на `*.svc.cluster.local`. В облаке — Route53, Cloud DNS, внутренние BIND/Windows AD. External-dns синхронизирует Ingress → записи. Принцип тот же: знать **кто authoritative** для зоны и не править только hosts на одной машине.

При инциденте «после смены IP не коннектится» спросите: **TTL прошёл?** **Все резолверы обновились?** **Нет ли переопределения в /etc/hosts на клиенте?**

## Резюме

DNS — отдельный слой от «ping по IP». Резолвинг идёт по правилам nsswitch; hosts может обойти DNS. **dig @server** — главный инструмент отладки. В стенде authoritative — **172.28.0.53**. TTL и кэш объясняют «после переезда половина клиентов на старом IP».

## Чек-лист

- В каком порядке `files` и `dns` в nsswitch?
- Чем A отличается от CNAME?
- Как запросить только dns-контейнер стенда?
- Что такое TTL и зачем его снижают перед миграцией?

Следующий урок: [04. Лаба: DNS](04-lab-dns.md).
