# 04. Лаба: DNS на стенде lab.local

## Цель лабы

Пройти полный цикл: прямой запрос к BIND, обратный DNS, сравнение **/etc/hosts** и DNS, временная смена **resolv.conf** — чтобы в инциденте не путать «DNS сломан» и «приложение сломано».

## Предварительно

`docker compose ps` — **lab** и **dns** в Up. Работа из:

```bash
docker compose exec lab bash
```

Установите `dnsutils`, если нет `dig`:

```bash
sudo apt install -y dnsutils
```

---

## Задание 1. Прямой запрос к BIND

**Зачем:** обойти кэш и resolv — спросить authoritative стенда.

```bash
dig @172.28.0.53 srv1.lab.local +short
dig @172.28.0.53 web.lab.local +short
dig @172.28.0.53 srv1.lab.local
```

**Что увидите:** в `+short` — IP (ожидаются **172.28.0.11** и **172.28.0.20**, если зона в bind совпадает со стендом). В полном выводе — секция `ANSWER SECTION`, TTL.

**Если SERVFAIL / timeout:** `docker compose ps` — контейнер dns; `ping -c2 172.28.0.53`.

---

## Задание 2. Обратный lookup

**Зачем:** почти в почте и логах встречается проверка PTR.

```bash
dig -x 172.28.0.11 @172.28.0.53 +short
dig -x 172.28.0.20 @172.28.0.53 +short
```

**Что увидите:** hostname или пусто, если PTR в зоне не настроен — для лабы это нормально, зафиксируйте факт.

---

## Задание 3. getent и hosts

**Зачем:** увидеть приоритет **files** перед dns.

```bash
grep lab.local /etc/hosts
getent hosts srv1.lab.local
```

Если в hosts **нет** srv1 — добавьте временно:

```bash
echo "172.28.0.11 srv1.lab.local srv1" | sudo tee -a /etc/hosts
getent hosts srv1.lab.local
ping -c1 srv1.lab.local
```

**Что увидите:** IP из hosts, даже если DNS другой.

Удалите строку после эксперимента, если мешает следующим лабам:

```bash
sudo sed -i '/srv1.lab.local/d' /etc/hosts
```

---

## Задание 4. resolv.conf (временно)

**Зачем:** понять, как lab узнаёт DNS по умолчанию.

```bash
cp /etc/resolv.conf /tmp/resolv.bak 2>/dev/null || true
cat /etc/resolv.conf
echo 'nameserver 172.28.0.53' | sudo tee /etc/resolv.conf
dig srv1.lab.local +short
sudo cp /tmp/resolv.bak /etc/resolv.conf 2>/dev/null || true
```

В Docker файл может перезаписаться при перезапуске — лаба про **механизм**, не про постоянный конфиг.

**Если dig без @ не использует .53** — явный `@172.28.0.53` всегда корректен.

---

## Задание 5. Сравнение host и dig

```bash
host srv1.lab.local 172.28.0.53
nslookup srv1.lab.local 172.28.0.53
```

**Что увидите:** те же IP, разный формат вывода.

---

## Задание 6. traceroute до web (опционально)

```bash
traceroute -n 172.28.0.20 2>/dev/null | head -5 || tracepath -n 172.28.0.20 | head -5
```

В bridge-сети часто один hop — нормально.

---

## Критерии успеха

- [ ] `dig @172.28.0.53` вернул IP для srv1 и web
- [ ] Понимаете роль `/etc/hosts` vs DNS
- [ ] `getent hosts` и `ping` по имени отработали
- [ ] Восстановили resolv.conf (если меняли)

## Что унести в работу

- Отладка DNS начинается с `dig @authoritative`, не с «перезапустил приложение».
- Проверяйте hosts перед войной с админами DNS.

Следующий урок: [05. NAT и forwarding](05-nat-forwarding.md).
