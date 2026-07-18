# 15. keepalived и VRRP

## Введение: один IP на одном nginx — SPOF

Клиенты ходят на `172.28.0.11`. srv1 падает — сайт недоступен, даже если **srv2** готов принять трафик. **VIP (Virtual IP)** — адрес, который «плавает» между healthy нодами; **keepalived** реализует **VRRP** на Linux.

В облаке часто заменяют **Load Balancer + health check**; on-prem и lab — keepalived + VRRP.

## Что вы узнаете

- Роли **MASTER** / **BACKUP**.
- **virtual_router_id**, **priority**, **advert_int**.
- Блок **virtual_ipaddress**.
- **track_script** и nginx health.
- Overlay стенда и ограничения Docker.

---

## VRRP (кратко)

**Virtual Router Redundancy Protocol** — multicast **224.0.0.18**, ноды договариваются, кто держит VIP.

| Роль | Поведение |
|------|-----------|
| **MASTER** | VIP на интерфейсе, отвечает ARP |
| **BACKUP** | ждёт; не получил advert → takeover |

| Параметр | Смысл |
|----------|--------|
| `virtual_router_id` | 1–255, **одинаковый** на паре |
| `priority` | выше → предпочтительный MASTER |
| `advert_int` | интервал объявлений (сек) |

---

## keepalived.conf (пример MASTER)

```text
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass lab_secret_8   # ровно 8 символов для PASS
    }

    virtual_ipaddress {
        172.28.0.100/24 dev eth0
    }
}
```

На **BACKUP** (srv2): `state BACKUP`, `priority 90`.

```bash
sudo systemctl enable --now keepalived
ip addr show dev eth0 | grep 172.28.0.100
```

---

## Health check (track_script)

VRRP видит только «сосед жив». **Nginx мёртв, keepalived жив** — VIP остаётся на плохой ноде.

```text
vrrp_script chk_nginx {
    script "/usr/bin/curl -sf http://127.0.0.1/ || exit 1"
    interval 2
    weight -20
}

vrrp_instance VI_1 {
    ...
    track_script {
        chk_nginx
    }
}
```

При fail script priority падает → BACKUP забирает VIP.

---

## Docker overlay

[`deploy/linux/docker-compose.advanced.yml`](../../deploy/linux/docker-compose.advanced.yml) — вторая сеть для VRRP между srv1/srv2.

**Ограничения lab:** multicast в bridge может вести себя иначе, чем на bare metal — учите **концепт**, не только ping VIP.

---

## vs облако

| On-prem / lab | Cloud |
|---------------|-------|
| keepalived + VIP | ALB/NLB + target groups |
| ARP failover | health checks API |

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| оба MASTER | split-brain, разный router_id |
| VIP нигде | fw, wrong interface |
| нет failover | priority одинаковый |
| PASS в git | слабая auth — только lab |

---

## В продакшене

**unicast VRRP** вместо multicast в L2. Сильная auth. Согласование с **conntrack** при stateful fw. Документировать, кто MASTER после reboot.

---

## Резюме

**VIP** убирает SPOF на L3. **keepalived** — VRRP на Linux. **track_script** связывает с app health. В lab — srv1 MASTER, srv2 BACKUP, VIP **172.28.0.100**.

## Чек-лист

- [ ] Что такое VIP?
- [ ] Зачем одинаковый virtual_router_id?
- [ ] Почему PASS auth слабый?
- [ ] Зачем track_script?

Следующий урок: [16. Лаба: keepalived](16-lab-keepalived.md).
