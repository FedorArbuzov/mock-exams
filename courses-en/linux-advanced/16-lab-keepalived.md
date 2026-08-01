# 16. Lab: keepalived and VIP (training stand)

## Lab goal

Bring up **keepalived** on srv1 (MASTER) and srv2 (BACKUP), assign a **VIP 172.28.0.100**, verify ping/curl from lab and optionally **failover** when stopping keepalived on MASTER.

## Prerequisites

- [15. keepalived](15-keepalived.md).
- nginx on MASTER is desirable for curl to the VIP.

```bash
cd deploy/linux
docker compose -f docker-compose.yml -f docker-compose.advanced.yml up -d
```

---

## Preparing the stand

```bash
docker compose ps
ping -c1 172.28.0.11
ping -c1 172.28.0.12
```

On srv1, install keepalived and nginx (if absent):

```bash
ssh course@172.28.0.11 'sudo apt install -y keepalived nginx'
```

---

## Task 1. MASTER on srv1

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

**If the VIP is not visible:** `journalctl -u keepalived -n 30`, check the `interface` (`ip -br a`).

---

## Task 2. BACKUP on srv2

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

On BACKUP the VIP is **usually not** present while MASTER is alive.

---

## Task 3. Check from lab

```bash
docker compose exec lab bash
ping -c2 172.28.0.100
curl -s --connect-timeout 2 http://172.28.0.100/ | head -5 || echo "install nginx on MASTER"
```

---

## Task 4. Failover (optional)

```bash
ssh course@172.28.0.11 'sudo systemctl stop keepalived'
sleep 3
ping -c2 172.28.0.100
ssh course@172.28.0.12 'ip -br a | grep 172.28.0.100'
```

**Expectation:** the VIP is on srv2. Bring srv1 back:

```bash
ssh course@172.28.0.11 'sudo systemctl start keepalived'
```

---

## Task 5. Notes

On lab:

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

## Success criteria

- [ ] keepalived active on both nodes
- [ ] VIP visible on MASTER
- [ ] ping VIP from lab OK
- [ ] You understand failover (or noted the Docker limitation)

## What to take to work

- Split-brain — different `virtual_router_id` or network.
- VIP without an app — configure nginx + track_script in prod.
- In the cloud — ALB instead of VRRP.

Next lesson: [17. iSCSI (theory)](17-iscsi-theory.md).
