# 16. Синтез: runbook, собеседования, чек-лист

## Практическое задание: network runbook

Выберите сервис:

- учебный: `web` (`172.28.0.20`) из [deploy/linux](../../deploy/linux/README.md);
- или [aws-intermediate image-platform](../aws-intermediate/projects/image-platform/) (ALB + private subnets);
- или Ingress из [deploy/gitops](../../deploy/gitops/README.md) на `mockctl`.

### Deliverables (2–3 часа)

1. **Диаграмма path** (ASCII или mermaid): client → edge → app → DB.
2. **Таблица CIDR** — все подсети / SG / NP на пути.
3. **Runbook** по шаблону из [главы 13](13-troubleshooting.md) — минимум 5 quick checks.
4. **Три «сломай и почини»** гипотезы (как в [лабе 15](15-lab-troubleshooting.md)) с ожидаемым симптомом.
5. **MTU note** — есть ли VPN/overlay на пути ([глава 11](11-tls-mtu.md)).

### Критерии самопроверки

| # | Критерий |
|---|----------|
| 1 | Path не смешивает bastion и user traffic |
| 2 | Указаны SG/NACL или host firewall отдельно |
| 3 | DNS split-horizon учтён, если есть public + internal |
| 4 | Есть команды L3/L4/L7, не только «перезапустить» |
| 5 | Связь с курсами mock-exams для углубления |

---

## Карта курса

```text
01–04   L2–L7 модель           →  «на каком уровне болит»
05–06   Маршруты, NAT          →  «куда идёт пакет»
07      VPC AWS                →  «облачные границы»
08–09   Overlay, BGP           →  «K8s и DC WAN»
10–11   DNS, TLS, MTU          →  «имя, доверие, размер кадра»
12–14   K8s, debug, security   →  «прод и zero trust»
15–16   Лаба, runbook          →  «ваш артефакт»
```

---

## Вопросы с собеседований

### 1. Timeout vs connection refused?

**Refused** — RST от хоста: порт закрыт / не listen. **Timeout** — нет ответа: filter, blackhole route, NP drop, wrong path.

### 2. IGW vs NAT Gateway?

**IGW** — bidirectional для ресурсов с public IP в public subnet. **NAT GW** — только outbound SNAT из private subnet.

### 3. SG vs NACL?

**SG** — stateful на ENI, allow-only. **NACL** — stateless на subnet, allow/deny, нужны правила на return traffic.

### 4. Зачем overlay в Kubernetes?

Плотная изоляция Pod сетей, policy, не исчерпать VPC IP (кроме VPC CNI mode). Underlay видит IP **нод** или encapsulation.

### 5. Что такое BGP в двух предложениях?

Обмен маршрутами между AS. В DC/cloud — доставить префикс `10.0.0.0/16` до правильного next-hop.

### 6. PMTUD blackhole?

ICMP «fragmentation needed» блокирован при DF=1 → TCP зависает на large packets. Лечение: MTU/MSS, разрешить ICMP, jumbo where supported.

### 7. Как debug «работает в curl с ноды, не из Pod»?

`dig` из Pod, `ip route` на ноде, NetworkPolicy, Service vs Pod IP, разный DNS (ndots), SNAT/SG на ноде.

---

## В mock-exams — куда дальше

| Цель | Курс |
|------|------|
| Экзамен CKA сеть | [kuber-advanced](../kuber-advanced/README.md), [mock-ckad](../mock-ckad/README.md) |
| AWS сеть прод | [aws-advanced](../aws-advanced/README.md) TGW, PrivateLink |
| SRE процессы | [sre](../sre/README.md) |
| Метрики path | [observability-*](../observability-basic/README.md) |
| nginx / TLS edge | [nginx-intermediate](../nginx-intermediate/README.md) |

---

## Мастер чек-лист зрелости

- [ ] Могу спроектировать VPC `/16` с public/private и NAT без overlap.
- [ ] Объясняю path пакета Pod → internet на EKS.
- [ ] Веду инцидент по слоям без «открыть все порты».
- [ ] Знаю, где смотреть Flow Logs / tcpdump / `ss`.
- [ ] Документ runbook лежит рядом с сервисом в Git.

---

## Резюме

Networking-deep заканчивается **вашим** runbook — не чужой схемой. Если вы можете нарисовать path и назвать **одну команду на слой** — курс выполнил цель.
