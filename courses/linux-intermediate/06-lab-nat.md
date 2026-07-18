# 06. Лаба: forwarding и NAT Docker

## Цель лабы

Понять на практике три вещи из [теории NAT](05-nat-forwarding.md):

1. **ip_forward** — можно ли ядру пересылать пакеты между интерфейсами.
2. **Маршрут и SNAT** — почему «интернет из контейнера» может не работать, хотя ping внутри сети lab есть.
3. **DNAT Docker** — как `ports:` в compose превращается в правила iptables на хосте.

Вы **не** настраиваете lab как интернет-шлюз — только наблюдаете, как это устроено в Docker.

## Предварительно

- Прочитаны [05. NAT и forwarding](05-nat-forwarding.md).
- Стенд: `cd deploy/linux && docker compose up -d`.
- Сессия в lab: `docker compose exec lab bash`.

---

## Подготовка стенда

```bash
hostname
ip -br a
ip route
```

Запишите default route (если есть) и интерфейс с адресом **172.28.0.10**.

---

## Задание 1. IP forwarding

**Зачем:** без `ip_forward=1` Linux не маршрутизирует чужие пакеты между интерфейсами — типичная причина «NAT не работает» на своём VPS-шлюзе.

```bash
cat /proc/sys/net/ipv4/ip_forward
sysctl net.ipv4.ip_forward
```

**Что увидите:** чаще всего **1** в контейнере lab (Docker включает forwarding для bridge).

**Если 0:**

```bash
sudo sysctl -w net.ipv4.ip_forward=1
cat /proc/sys/net/ipv4/ip_forward
```

**Если не работает:** нет прав — вы не в lab или нет sudo.

---

## Задание 2. Маршрут «наружу»

**Зачем:** отличить «нет NAT на хосте» от «нет default route в контейнере».

```bash
ip route show default
ip route get 1.1.1.1
curl -s --connect-timeout 3 -o /dev/null -w "https example.com: %{http_code}\n" https://example.com || echo "no outbound from lab (OK for lab)"
```

| Результат curl | Интерпретация |
|----------------|---------------|
| 200/301/302 | исходящий интернет из lab есть |
| timeout / failed | нет маршрута или SNAT на хосте — **норма** для учебной сети |

Внутренняя сеть **172.28.0.0/16** при этом работает независимо.

---

## Задание 3. Внутренняя связность (без NAT)

**Зачем:** убедиться, что L3 между контейнерами не требует DNAT.

```bash
ping -c2 172.28.0.11
ping -c2 172.28.0.20
curl -s -o /dev/null -w "web direct: %{http_code}\n" http://172.28.0.20/ 2>/dev/null || echo "web:80 not up"
```

**Что увидите:** ping replies; curl на web — 200, если nginx на web поднят.

Это **прямой** L3: пакет lab → 172.28.0.20, без publish портов на хосте.

---

## Задание 4. NAT-таблица

**Зачем:** увидеть цепочки **DOCKER** / **DNAT** (имена зависят от backend: iptables-nft vs legacy).

На lab (если есть права):

```bash
sudo iptables-nft -t nat -L -n 2>/dev/null | head -40
# или
sudo iptables -t nat -L -n 2>/dev/null | head -40
```

**Что увидите:** цепочки `DOCKER`, правила `DNAT` с портами — или пусто, если в контейнере нет полного netfilter.

На **хосте** (каталог `deploy/linux`, вне lab):

```bash
docker compose ps
docker compose port web 80 2>/dev/null
docker port $(docker compose ps -q web 2>/dev/null) 2>/dev/null
```

**Что увидите:** что-то вроде `0.0.0.0:32768->80/tcp` — хост слушает случайный/заданный порт и **перенаправляет** в контейнер web.

**Связь с теорией:** это **DNAT**: клиент → IP:PORT хоста → IP:80 внутри контейнера.

---

## Задание 5. Два пути к одному nginx

**Зачем:** закрепить разницу «внутри docker network» vs «с хоста через publish».

Из **lab**:

```bash
curl -s -o /dev/null -w "from lab to 172.28.0.20: %{http_code}\n" http://172.28.0.20/
```

С **хоста** (подставьте порт из `docker compose port web 80`):

```bash
curl -s -o /dev/null -w "from host published port: %{http_code}\n" http://127.0.0.1:ПОРТ/
```

| Путь | NAT? |
|------|------|
| lab → 172.28.0.20 | нет, L2/L3 bridge |
| host → 127.0.0.1:PORT → container | да, DNAT на хосте |

**Если curl с хоста fail:** сервис web не запущен или порт не publish в `docker-compose.yml`.

---

## Задание 6. FORWARD (опционально)

**Зачем:** в проде firewall часто режет **FORWARD**, а не INPUT.

```bash
sudo iptables-nft -L FORWARD -n 2>/dev/null | head -15
```

В Docker обычно разрешён forward между bridge и контейнерами — политика задаётся демоном docker.

---

## Задание 7. Сохранить ip_forward (только lab)

```bash
echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-lab-forward.conf
sudo sysctl --system 2>/dev/null | grep ip_forward
```

В учебном контейнере после пересоздания всё равно сбросится — в проде sysctl.d обязателен на router/NAT-нодах.

---

## Критерии успеха

- [ ] Знаете значение `ip_forward` на lab и зачем оно нужно
- [ ] Объяснили себе: внутренний curl на .20 vs published port с хоста
- [ ] Видели `docker port` / nat-цепочки или понимаете, почему их нет внутри lab
- [ ] Не путаете «нет интернета в контейнере» с «нет связи srv1↔lab»

## Что унести в работу

- **Published port** = DNAT на хосте; диагностика — `docker port`, `iptables -t nat`, не только `curl` внутри pod network.
- **SNAT** нужен для исходящего интернета из private subnet — настраивается на шлюзе, не в каждом app-контейнере.
- **FORWARD** + **conntrack** — первая линия при «между VLAN не ходит, внутри VLAN ходит».

Следующий урок: [07. Firewall](07-firewall.md).
