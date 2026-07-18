# 02. Лаба: ip, маршруты и карта стенда

## Цель лабы

Вы не просто выполните команды — вы **составите карту сети** учебного стенда: свой IP, шлюз, кто из соседей жив, что слушает srv1. Эта карта будет шпаргалкой для всех следующих лаб (DNS, firewall, nginx).

## Предварительно

- Docker Desktop / Engine запущен.
- Из каталога репозитория:

```bash
cd deploy/linux
docker compose up -d
docker compose ps
```

Все контейнеры **Up**. Если **Restarting** — подождите 60 секунд.

- Вход в lab:

```bash
docker compose exec lab bash
```

Учётки SSH на srv*: **course** / **course**.

---

## Подготовка стенда

Внутри lab:

```bash
whoami
hostname
ping -c1 127.0.0.1
```

Если `ping` нет: `apt install -y iputils-ping`.

---

## Задание 1. Ваш IP-адрес

**Зачем:** без этого нельзя понять, «вы в той же подсети», что srv1.

```bash
ip -4 -br addr
ip -4 addr show
```

**Что увидите** (пример):

```text
eth0@ifXX    UP    172.28.0.10/24
```

Запишите в блокнот:

```text
Мой хост: lab
Мой IP:   172.28.0.10
Маска:    /24 (255.255.255.0)
```

**Если IP не 172.28.0.10** — возможно другая сеть compose; используйте **свой** IP в следующих шагах.

**Если интерфейс DOWN:** `docker compose restart lab`.

---

## Задание 2. Таблица маршрутов

**Зачем:** понять, пойдёт ли пакет к соседу напрямую или через шлюз.

```bash
ip route show
```

Типичный вывод:

```text
default via 172.28.0.1 dev eth0
172.28.0.0/24 dev eth0 proto kernel scope link src 172.28.0.10
```

Первая строка — **default route** (интернет, если есть). Вторая — «вся подсеть 172.28.0.0/24 — напрямую через eth0».

Детализация «куда ядро отправит пакет»:

```bash
ip route get 172.28.0.11
ip route get 172.28.0.53
ip route get 1.1.1.1
```

**Что увидите для .11:**

```text
172.28.0.11 dev eth0 src 172.28.0.10 uid 0
    cache
```

Нет слова **via** — шлюз не нужен, это **сосед**.

**Для 1.1.1.1** — часто `via 172.28.0.1`. Если `RTNETLINK answers: Network is unreachable` — в lab нет выхода в интернет; **для лаб соседей это нормально**.

---

## Задание 3. Опрос соседей (ping)

**Зачем:** таблица «кто жив» в сети стенда.

```bash
for ip in 11 12 20 53; do
  printf "172.28.0.%s: " "$ip"
  if ping -c1 -W1 172.28.0.$ip >/dev/null 2>&1; then
    echo UP
  else
    echo DOWN
  fi
done
```

| IP | Ожидаемый хост |
|----|----------------|
| 172.28.0.11 | srv1 |
| 172.28.0.12 | srv2 |
| 172.28.0.20 | web |
| 172.28.0.53 | dns |

**Если DOWN:** `docker compose ps` на хосте — поднять контейнер.

**Зачем ping, если есть curl:** ping — L3 (ICMP). Можно пинговать, но HTTP закрыт firewall — разные уровни.

---

## Задание 4. Порты на srv1 (L4)

**Зачем:** связать «сеть есть» с «сервис принимает соединения».

```bash
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new course@172.28.0.11 'hostname; ss -tlnp | grep -E ":22|:80" || ss -tlnp | head -10'
```

**Что увидите:** `sshd` на **:22**. Порт **:80** — если nginx установлен.

Если SSH просит пароль — **course**.

Установите nginx для практики (опционально):

```bash
ssh course@172.28.0.11 'sudo apt update && sudo apt install -y nginx && sudo systemctl enable --now nginx'
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://172.28.0.11/
```

---

## Задание 5. ARP — сосед на канале (опционально)

**Зачем:** увидеть связь IP ↔ MAC в bridge.

```bash
ping -c1 172.28.0.11 >/dev/null
ip neigh show | grep 172.28.0.11
```

**Что увидите:** `REACHABLE` или `STALE` и MAC-адрес.

---

## Задание 6. Итоговая таблица (заполните сами)

Скопируйте в `~/lab-network-map.txt`:

```text
# Карта стенда linux-intermediate
lab:  172.28.0.10  $(ip -4 -br addr | awk '/UP/{print $3}')
srv1: 172.28.0.11  ping: ...
srv2: 172.28.0.12  ping: ...
web:  172.28.0.20  ping: ...
dns:  172.28.0.53  ping: ...
default gw: $(ip route | awk '/default/{print $3}')
```

---

## Критерии успеха

- [ ] Записан IP lab
- [ ] `ip route get 172.28.0.11` без ошибки
- [ ] ping до srv1 успешен
- [ ] SSH на srv1 показал hostname
- [ ] Файл `lab-network-map.txt` создан

## Что унести в работу

- Диагностика: **addr → route → ping → ss → curl** (снизу вверх).
- Карта IP стенда — держите под рукой до конца intermediate.

Следующий урок: [03. DNS](03-dns.md).
