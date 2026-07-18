# 16. Лаба: keepalived и VIP (учебный стенд)

## Цель лабы

Поднять **keepalived** на srv1 (MASTER) и srv2 (BACKUP), назначить **VIP 172.28.0.100**, проверить ping/curl с lab и опционально **failover** при stop keepalived на MASTER.

## Предварительно

- [15. keepalived](15-keepalived.md).
- nginx на MASTER желателен для curl к VIP.

```bash
cd deploy/linux
docker compose -f docker-compose.yml -f docker-compose.advanced.yml up -d
```

---

## Подготовка стенда

```bash
docker compose ps
ping -c1 172.28.0.11
ping -c1 172.28.0.12
```

На srv1 установите keepalived и nginx (если нет):

```bash
ssh course@172.28.0.11 'sudo apt install -y keepalived nginx'
```

---

## Задание 1. MASTER на srv1

```bash
ssh course@172.28.0.11
sudo tee /etc/keepalived/keepalived.conf <<'EOF'
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass lab12345
    }
    virtual_ipaddress {
        172.28.0.100/24 dev eth0
    }
}
EOF
sudo systemctl enable --now keepalived
ip -br a | grep 172.28.0.100 || ip addr show eth0 | grep 172.28.0.100
```

**Если VIP не виден:** `journalctl -u keepalived -n 30`, проверьте `interface` (`ip -br a`).

---

## Задание 2. BACKUP на srv2

```bash
ssh course@172.28.0.12
sudo apt install -y keepalived
sudo tee /etc/keepalived/keepalived.conf <<'EOF'
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 51
    priority 90
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass lab12345
    }
    virtual_ipaddress {
        172.28.0.100/24 dev eth0
    }
}
EOF
sudo systemctl enable --now keepalived
```

На BACKUP VIP **обычно не** висит, пока MASTER жив.

---

## Задание 3. Проверка с lab

```bash
docker compose exec lab bash
ping -c2 172.28.0.100
curl -s --connect-timeout 2 http://172.28.0.100/ | head -5 || echo "install nginx on MASTER"
```

---

## Задание 4. Failover (опционально)

```bash
ssh course@172.28.0.11 'sudo systemctl stop keepalived'
sleep 3
ping -c2 172.28.0.100
ssh course@172.28.0.12 'ip -br a | grep 172.28.0.100'
```

**Ожидание:** VIP на srv2. Верните srv1:

```bash
ssh course@172.28.0.11 'sudo systemctl start keepalived'
```

---

## Задание 5. Заметки

На lab:

```bash
cat > /tmp/vrrp-notes.txt <<EOF
MASTER: srv1 priority 100
BACKUP: srv2 priority 90
VIP: 172.28.0.100
router_id: 51
Failover tested: yes/no
EOF
cat /tmp/vrrp-notes.txt
```

---

## Критерии успеха

- [ ] keepalived active на двух нодах
- [ ] VIP виден на MASTER
- [ ] ping VIP с lab OK
- [ ] Понимаете failover (или зафиксировали ограничение Docker)

## Что унести в работу

- Split-brain — разный `virtual_router_id` или сеть.
- VIP без app — настройте nginx + track_script в prod.
- В облаке — ALB вместо VRRP.

Следующий урок: [17. iSCSI (теория)](17-iscsi-theory.md).
