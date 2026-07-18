# Networking Deep

Углублённый курс по **сетям для DevOps / SRE / platform engineer**: L2–L7, маршрутизация, NAT, облачная VPC, overlay, BGP, DNS/TLS и **системная диагностика**. Теория в формате «книги» на русском; **две опциональные лабы** на стенде [`deploy/linux`](../../deploy/linux/README.md).

**Для кого:** инженеры после [`linux-intermediate`](../linux-intermediate/README.md) и [`aws-intermediate`](../aws-intermediate/README.md) (VPC), которые хотят связать «ping не идёт» с **маршрутом, NAT, overlay и облаком** — без пробелов между хостом, Docker, Kubernetes и AWS.

**Предварительно (обязательно пройти или знать на уровне курсов):**

| Курс | Зачем |
|------|--------|
| [linux-intermediate/01](linux-intermediate/01-tcp-ip.md) | TCP/IP, CIDR, маршруты |
| [linux-intermediate/05–06](linux-intermediate/05-nat-forwarding.md) | NAT, forwarding |
| [linux-intermediate/07–08](linux-intermediate/07-firewall.md) | firewall |
| [linux-intermediate/11–12](linux-intermediate/11-network-debug.md) | ss, curl, tcpdump |
| [aws-intermediate/01](aws-intermediate/01-vpc-custom.md) | VPC, IGW, NAT, subnets |
| [aws-intermediate/03](aws-intermediate/03-alb-security-groups.md) | SG, ALB |

**Полезно параллельно:** [kuber-basic](../kuber-basic/README.md), [containers-basic/06](../containers-basic/06-networking.md), [kuber-advanced/08](../kuber-advanced/08-network-internals.md), [bare-metal/07](../bare-metal/07-host-networking.md).

## Как читать

- Каждая глава — **35–55 минут**; с конспектом и схемами — до **75 минут**.
- Блок **«В mock-exams»** — ссылки на лабы и стенды репозитория (не обязателен для понимания сетей в целом).
- Лабы **15** — после глав **05–06** и **13**; стенд `deploy/linux` (~4 ГБ RAM Docker).

**Время:** ~**18–24 часа** теории + **2–3 часа** лаб; [финал](16-synthesis.md) — сетевой runbook (**2–3 часа**).

## Программа

### Часть I — Модель и уровни (01–04)

| № | Глава |
|---|--------|
| 01 | [Зачем networking-deep: карта L2–L7 и типичные сбои](01-intro.md) |
| 02 | [L2–L3: ARP, VLAN, CIDR и проектирование адресов](02-l2-l3.md) |
| 03 | [L4: TCP, UDP, conntrack, сокеты](03-l4-transport.md) |
| 04 | [L7: HTTP, прокси, балансировка, keep-alive](04-l7-http-proxies.md) |

### Часть II — Маршруты, NAT, облако (05–07)

| № | Глава |
|---|--------|
| 05 | [Маршрутизация: таблицы, policy routing, асимметрия](05-routing.md) |
| 06 | [NAT: SNAT/DNAT, hairpin, соответствие AWS IGW/NAT](06-nat.md) |
| 07 | [VPC AWS: SG vs NACL, peering, endpoints, TGW](07-vpc-aws.md) |

### Часть III — Overlay и WAN (08–09)

| № | Глава |
|---|--------|
| 08 | [Overlay: VXLAN, Geneve, Docker bridge, CNI](08-overlay.md) |
| 09 | [BGP для операторов: AS, path, peering](09-bgp.md) |

### Часть IV — Продакшен и диагностика (10–16)

| № | Глава |
|---|--------|
| 10 | [DNS в продакшене: split-horizon, TTL, failures](10-dns-production.md) |
| 11 | [TLS, SNI, MTU и PMTUD](11-tls-mtu.md) |
| 12 | [Kubernetes: Service, CNI, kube-proxy, Ingress](12-kubernetes-networking.md) |
| 13 | [Методология troubleshooting и runbook](13-troubleshooting.md) |
| 14 | [Зоны безопасности, zero trust, DDoS на краю](14-security-zones.md) |
| 15 | [Лаба: диагностика пути на deploy/linux](15-lab-troubleshooting.md) |
| 16 | [Синтез: runbook, собеседования, чек-лист](16-synthesis.md) |

## Что должно получиться

- Проектируете **CIDR** и понимаете, где заканчивается подсеть и начинается маршрутизатор.
- Объясняете разницу **SG vs NACL**, **IGW vs NAT**, **public vs private** subnet без путаницы.
- Читаете **overlay** (VXLAN) и связываете с Docker/Kubernetes/Cilium.
- Объясняете **BGP** на уровне «зачем AS и default route в DC».
- Ведёте диагностику **снизу вверх** (L3 → L4 → L7 → wire) и отличаете timeout от refused.
- Оформляете **одностраничный network runbook** для сервиса.

## Стенд

| Лаба | Требования |
|------|------------|
| [15-lab-troubleshooting](15-lab-troubleshooting.md) | [`deploy/linux`](../../deploy/linux/README.md): `docker compose up -d` |

Kubernetes-часть (глава 12) — опционально `mockctl up`; без кластера глава читается как теория.

## Литература (вне курса)

- Russ White et al. — *Computer Networking Problems and Solutions*
- AWS — *VPC User Guide*, *Advanced Networking*
- Ivan Pepelnjak — blog posts on overlay/BGP (ipspace.net)
- Книга *TCP/IP Illustrated*, том 1 — для углубления L4
