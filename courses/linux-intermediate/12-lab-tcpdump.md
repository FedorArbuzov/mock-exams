# 12. Лаба: tcpdump и разбор трафика

## Цель лабы

Снять **короткий** дамп HTTP и SSH, связать пакеты с **curl** и **ss** — навык «доказать, что SYN дошёл», а не гадать по таймауту. После лабы вы читаете строки `Flags [S]` / `[S.]` / `[P.]` как этапы TCP.

## Предварительно

- [11. Диагностика сети](11-network-debug.md).
- lab + srv1 (`172.28.0.11`) с ssh; nginx на :80 желателен.

```bash
docker compose exec lab bash
sudo apt install -y tcpdump curl iproute2
ping -c1 172.28.0.11
```

---

## Подготовка стенда

Запишите IP lab и srv1. Убедитесь, что есть **два** терминала в lab (или tmux с двумя панелями) — tcpdump в одном, curl в другом.

---

## Задание 1. Baseline: ss и curl

**Зачем:** зафиксировать L4/L7 **до** дампа — иначе непонятно, что искать в pcap.

```bash
ssh course@172.28.0.11 'ss -tlnp | grep -E ":22|:80"'
curl -s -o /dev/null -w "http=%{http_code}\n" http://172.28.0.11/ || echo "http failed — use only SSH in задании 4"
```

| Результат | Вывод |
|-----------|--------|
| http=200 | HTTP дамп в задании 2 имеет смысл |
| http failed | задания 2–3 пропустите, делайте SSH (4) |

---

## Задание 2. tcpdump HTTP (два терминала)

**Терминал A (lab):**

```bash
sudo tcpdump -i any host 172.28.0.11 and port 80 -nn -c 12
```

**Терминал B (lab):**

```bash
curl -s http://172.28.0.11/ > /dev/null
```

**Что увидите в A (порядок может слегка отличаться):**

```text
IP 172.28.0.10.xxxxx > 172.28.0.11.80: Flags [S], seq ...
IP 172.28.0.11.80 > 172.28.0.10.xxxxx: Flags [S.], seq ..., ack ...
IP 172.28.0.10.xxxxx > 172.28.0.11.80: Flags [.], ack ...
IP ... Flags [P.], ... HTTP GET / ...
```

| Флаг | Этап |
|------|------|
| `[S]` | SYN — начало TCP |
| `[S.]` | SYN-ACK |
| `[.]` | ACK |
| `[P.]` | данные (HTTP) |

**Если пусто:** nginx не на 80; замените фильтр на `port 22` или проверьте `host` (опечатка IP).

---

## Задание 3. curl -v — связь с пакетами

```bash
curl -v http://172.28.0.11/ 2>&1 | head -35
```

Отметьте в выводе:

1. `Trying 172.28.0.11:80...`
2. `Connected to 172.28.0.11`
3. `> GET / HTTP/1.1`
4. `< HTTP/1.1 200` (или другой код)

**Зачем:** L7 подтверждает то, что вы видели как `[P.]` в tcpdump.

---

## Задание 4. tcpdump SSH

**Терминал A:**

```bash
sudo tcpdump -i any host 172.28.0.11 and port 22 -nn -c 8
```

**Терминал B:**

```bash
ssh -o ConnectTimeout=5 course@172.28.0.11 'true'
```

**Что увидите:** SYN/SYN-ACK на **22/tcp**. Payload SSH **зашифрован** — в дампе «мусор» после handshake нормален.

---

## Задание 5. Запись в файл (опционально)

```bash
sudo tcpdump -i any host 172.28.0.11 and port 80 -nn -c 20 -w /tmp/lab-http.pcap
curl -s http://172.28.0.11/ > /dev/null
ls -lh /tmp/lab-http.pcap
sudo tcpdump -r /tmp/lab-http.pcap -nn -c 5
sudo rm -f /tmp/lab-http.pcap
```

Файл можно открыть в Wireshark на рабочей станции. **Не** коммитьте pcap с prod в git.

---

## Задание 6. Симуляция «пустого» дампа (учебно)

Запустите tcpdump с **неверным** портом, curl на 80:

```bash
sudo tcpdump -i any host 172.28.0.11 and port 9999 -nn -c 5 &
sleep 1
curl -s -o /dev/null http://172.28.0.11/
wait
```

**Зачем:** понять, что пустой tcpdump часто = **неверный фильтр**, а не «сети нет».

---

## Критерии успеха

- [ ] tcpdump поймал пакеты на port 80 **или** осознанно прошли только SSH
- [ ] Объяснили себе `[S]` и `[S.]`
- [ ] curl -v разобран по этапам
- [ ] Использовали `-nn` и `-c`

## Что унести в работу

- Порядок: **ss + curl**, потом **tcpdump** с узким фильтром.
- Без `-c` на busy-хосте — гигабайты за секунды.
- Пустой дамп — проверьте interface, host, port.

Следующий урок: [13. nginx](13-nginx.md).
