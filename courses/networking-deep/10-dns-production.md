# 10. DNS в продакшене: split-horizon, TTL, failures

## Введение

«Сеть не работает» в 30% инцидентов — **устаревший DNS** или split-horizon. База: [linux-intermediate/03](../linux-intermediate/03-dns.md), стенд BIND: `172.28.0.53` в [deploy/linux](../../deploy/linux/README.md).

---

## Иерархия разрешения

```text
Application → /etc/nsswitch → stub resolver (systemd-resolved)
           → recursive (corp DNS / 8.8.8.8)
           → authoritative (zone owner)
```

```bash
dig +trace api.example.com
dig @172.28.0.53 app.lab.local
```

---

## TTL и кэш

| Событие | Эффект |
|---------|--------|
| Смена IP, TTL=300 | до 5 мин клиенты на старом |
| TTL=0 | больше нагрузка на authoritative |
| Negative caching (NXDOMAIN) | «имя не существует» запоминается |

При **failover** снижайте TTL **заранее**, не в момент аварии.

---

## Split-horizon (views)

Один FQDN, **разные ответы**:

```text
api.service.internal
  из VPC:     10.0.10.50 (internal ALB)
  из internet: 203.0.113.10 (public ALB)
```

Без этого — hairpin и лишний NAT ([06-nat](06-nat.md)).

---

## Kubernetes DNS

`service.namespace.svc.cluster.local` — CoreDNS. Проблемы:

- **ndots:5** — лишние search suffix → задержки
- headless vs ClusterIP
- externalName — CNAME, не IP

```bash
kubectl run -it --rm dnstest --image=busybox -- nslookup my-svc.default.svc.cluster.local
```

---

## Private hosted zones (Route 53)

VPC association — зона видна **только** из привязанных VPC. Проверяйте **resolver rules** и **hybrid DNS** (on-prem ↔ cloud).

---

## Типичные сбои

| Симптом | Причина |
|---------|---------|
| Работает по IP, не по имени | DNS / search path |
| Часть клиентов на старом IP | TTL / кэш |
| Intermittent | две записи round-robin, одна мёртва |
| `SERVFAIL` | authoritative down, ACL на zone transfer |

---

## В mock-exams

- BIND lab: [linux-intermediate/03](../linux-intermediate/03-dns.md)
- Route53 private: [aws-advanced/09](../aws-advanced/09-route53-privatelink.md)

---

## Резюме

DNS — **распределённый кэш с политикой**. Любой cutover IP требует плана TTL и проверки **всех** resolver paths (corp laptop, Pod, Lambda VPC).

---

## Чек-лист

- [ ] Объясните split-horizon на примере internal ALB.
- [ ] Зачем `dig +trace`?
- [ ] Как ndots влияет на latency?

**Дальше:** [11. TLS, SNI, MTU](11-tls-mtu.md).
