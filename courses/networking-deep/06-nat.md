# 06. NAT: SNAT/DNAT, hairpin, соответствие AWS IGW/NAT

## Введение

NAT переводит адреса на границе. DevOps видит NAT в **iptables MASQUERADE**, **Docker**, **kube-proxy**, **AWS NAT Gateway** и **ALB**. Разные места — одна идея: **conntrack связывает** внешний и внутренний 5-tuple.

База: [linux-intermediate/05–06](../linux-intermediate/05-nat-forwarding.md).

---

## SNAT и DNAT

| Тип | Направление | Пример |
|-----|-------------|--------|
| SNAT | внутренний → внешний | private subnet → интернет через NAT GW |
| DNAT | внешний → внутренний | ALB → instance:8080, `kubectl port-forward` |

```bash
# пример MASQUERADE (учебный, не copy-paste в prod без policy)
iptables -t nat -A POSTROUTING -s 172.28.0.0/24 -o eth0 -j MASQUERADE
```

---

## Hairpin (NAT loopback)

Клиент **внутри** сети обращается к **публичному DNS** своего же сервиса:

```text
App (10.0.10.5) → public IP ALB → ???
```

Без hairpin/NAT reflection пакет уходит «наружу» и теряется. Решения:

- **internal DNS** (private zone) → private IP / internal ALB
- split-horizon DNS
- NAT hairpin на edge router (редко в cloud)

---

## Docker NAT

```text
Container 172.17.0.2 → NAT на host IP → internet
Host → container: published port -p 8080:80
```

`docker0` bridge — отдельная подсеть; **не путать** с VPC CIDR на EC2.

---

## AWS: IGW vs NAT Gateway

| | Internet Gateway | NAT Gateway |
|---|------------------|-------------|
| Направление | inbound+outbound для public IP | только outbound SNAT |
| Где | public subnet route | private subnet default route |
| Публичный IP instance | да (optional) | нет на instance |

**NACL** на subnet NAT — stateless: нужны ephemeral ports **обратно**.

---

## kube-proxy SNAT

Pod → внешний IP: часто SNAT **IP ноды** (или IP из SNAT policy CNI). Поэтому **SG на ноде** и **NACL** важны для egress.

---

## В mock-exams

- Лаба NAT: [linux-intermediate/06-lab-nat](../linux-intermediate/06-lab-nat.md)
- VPC: [aws-intermediate/01](../aws-intermediate/01-vpc-custom.md)

---

## Резюме

NAT **скрывает** топологию и **ломает** трассировку без учёта translation. Hairpin и split DNS — частые «магические» баги после миграции в облако.

---

## Чек-лист

- [ ] Объясните SNAT при выходе Pod в интернет на EKS.
- [ ] Почему private instance без NAT не качает образы?
- [ ] Чем DNAT ALB отличается от SNAT NAT GW?

**Дальше:** [07. VPC AWS](07-vpc-aws.md).
