# 03. L4: TCP, UDP, conntrack, сокеты

## Введение

«Порт открыт» ≠ «сервис здоров». TCP может **зависнуть в half-open**, conntrack **переполниться**, UDP «молча» терять пакеты. DevOps живёт на L4 чаще, чем думает — каждый `Connection timed out` это L4 или filter под ним.

База: [linux-intermediate/01](../linux-intermediate/01-tcp-ip.md), инструменты: [11-network-debug](../linux-intermediate/11-network-debug.md).

---

## TCP: состояния, которые видит on-call

```text
CLOSED → SYN_SENT → ESTABLISHED → FIN_WAIT → CLOSED
              ↓
         (нет SYN-ACK) → timeout у клиента
```

| Симптом клиента | Вероятная причина |
|-----------------|-------------------|
| `Connection refused` | RST: порт закрыт / не listen |
| `Connection timed out` | SYN не дошёл / droppped (firewall, wrong route) |
| Зависание после connect | приложение не читает / middleware |
| Разрыв mid-request | LB idle timeout, NAT session expired |

```bash
ss -tan state syn-recv
ss -tan state time-wait | wc -l
```

**TIME_WAIT** на сервере после высокого RPS — норма; лечится `reuseport`, tuning, больше source IP на клиенте — не «перезапуск nginx» вслепую.

---

## UDP

- Нет установления сессии — **нет** `refused` в классическом виде.
- DNS, QUIC, VoIP, statsd — UDP; «не работает» = timeout или app-level error.
- Firewall **должен** разрешать ответный трафик (stateful обычно помогает для related).

---

## conntrack (netfilter)

Stateful firewall и NAT хранят таблицу **(src,dst,proto,ports) → translation**.

```bash
cat /proc/sys/net/netfilter/nf_conntrack_count
cat /proc/sys/net/netfilter/nf_conntrack_max
dmesg | grep -i conntrack
```

| Проблема | Эффект |
|---------|--------|
| Table full | новые соединения droppped |
| Short NAT timeout | long-lived idle TCP рвётся |
| Asymmetric routing | ответ не попадает в ту же запись |

В AWS **Security Group** stateful на уровне hypervisor — аналогия с conntrack, но вы не видите таблицу.

---

## Сокеты и bind

```bash
ss -tlnp | grep ':8080'
```

| Bind address | Кто подключается |
|--------------|------------------|
| `0.0.0.0` | все интерфейсы |
| `127.0.0.1` | только localhost |
| `10.0.10.5` | только этот IP |

**Sidecar / Service mesh** добавляют `127.0.0.1` redirect — `ss` на «главном» порту может обманывать; смотрите ещё `iptables -t nat -L`.

---

## Backlog и очереди

`listen()` backlog + `somaxconn` — при burst SYN клиенты видят timeout или slow accept.

Симптомы перегруза L4:

- `SYN flood` mitigation срабатывает
- `Recv-Q` растёт в `ss` при LISTEN

---

## В mock-exams

- NAT ломает conntrack при неправильном MASQUERADE: [06-nat](06-nat.md)
- K8s kube-proxy — NAT к Pod IP: [12-kubernetes-networking](12-kubernetes-networking.md)

---

## Резюме

L4 — **доступность порта и жизнь сессии**. Refused vs timeout — главный вилочный знак. conntrack связывает NAT и stateful firewall — при «случайных» обрывах смотрите таблицу и симметрию пути.

---

## Чек-лист

- [ ] Объясните refused vs timeout на примере закрытого SG.
- [ ] Зачем смотреть `ss` на сервере, если LB отдаёт 502?
- [ ] Что произойдёт при переполнении conntrack?

**Дальше:** [04. L7: HTTP, прокси, балансировка](04-l7-http-proxies.md).
