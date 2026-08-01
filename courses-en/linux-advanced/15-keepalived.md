# 15. keepalived and VRRP

## Intro: one IP on a single nginx — an SPOF

Clients connect to `172.28.0.11`. srv1 goes down — the site is unavailable, even if **srv2** is ready to take traffic. A **VIP (Virtual IP)** is an address that "floats" between healthy nodes; **keepalived** implements **VRRP** on Linux.

In the cloud this is often replaced by a **Load Balancer + health check**; on-prem and lab — keepalived + VRRP.

## What you'll learn

- The **MASTER** / **BACKUP** roles.
- **virtual_router_id**, **priority**, **advert_int**.
- The **virtual_ipaddress** block.
- **track_script** and nginx health.
- The stand overlay and Docker limitations.

---

## VRRP (brief)

**Virtual Router Redundancy Protocol** — multicast **224.0.0.18**, the nodes agree on who holds the VIP.

| Role | Behavior |
|------|-----------|
| **MASTER** | VIP on the interface, answers ARP |
| **BACKUP** | waits; no advert received → takeover |

| Parameter | Meaning |
|----------|--------|
| `virtual_router_id` | 1–255, **the same** on the pair |
| `priority` | higher → preferred MASTER |
| `advert_int` | advertisement interval (sec) |

---

## keepalived.conf (MASTER example)

```text
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass lab_secret_8   # exactly 8 characters for PASS
    }

    virtual_ipaddress {
        172.28.0.100/24 dev eth0
    }
}
```

On **BACKUP** (srv2): `state BACKUP`, `priority 90`.

```bash
sudo systemctl enable --now keepalived
ip addr show dev eth0 | grep 172.28.0.100
```

---

## Health check (track_script)

VRRP only sees "the neighbor is alive". **Nginx is dead, keepalived is alive** — the VIP stays on the bad node.

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

When the script fails, priority drops → BACKUP takes the VIP.

---

## Docker overlay

[`deploy/linux/docker-compose.advanced.yml`](../../deploy/linux/docker-compose.advanced.yml) — a second network for VRRP between srv1/srv2.

**Lab limitations:** multicast in a bridge may behave differently than on bare metal — learn the **concept**, not just pinging the VIP.

---

## vs cloud

| On-prem / lab | Cloud |
|---------------|-------|
| keepalived + VIP | ALB/NLB + target groups |
| ARP failover | health checks API |

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| both MASTER | split-brain, different router_id |
| VIP nowhere | fw, wrong interface |
| no failover | same priority |
| PASS in git | weak auth — lab only |

---

## In production

**unicast VRRP** instead of multicast in L2. Strong auth. Coordination with **conntrack** when using a stateful firewall. Document who is MASTER after a reboot.

---

## Summary

A **VIP** removes the SPOF at L3. **keepalived** — VRRP on Linux. **track_script** links it to app health. In lab — srv1 MASTER, srv2 BACKUP, VIP **172.28.0.100**.

## Checklist

- [ ] What is a VIP?
- [ ] Why the same virtual_router_id?
- [ ] Why is PASS auth weak?
- [ ] Why track_script?

Next lesson: [16. Lab: keepalived](16-lab-keepalived.md).
