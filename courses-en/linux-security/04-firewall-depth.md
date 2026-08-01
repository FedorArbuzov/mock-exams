# 04. Defense in depth

## The idea

One control **breaks** — the next one must stop the attack.

```text
[1] Cloud SG / perimeter ACL
[2] Host firewall (ufw/nft)
[3] Application bind 127.0.0.1
[4] AuthZ in the application
[5] Encryption at rest
```

## Layer 1: the perimeter

In AWS — **Security Groups**. Allow only 443 from the ALB, 22 from the bastion IP.

## Layer 2: the host

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 10.0.0.0/8 to any port 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**nftables** — more flexible, a single ruleset:

See [examples/nftables-lab.nft](examples/nftables-lab.nft):

- policy drop on input;
- established,related accept;
- lo accept;
- 22, 80 explicitly.

```bash
sudo nft -f /path/to/nftables-lab.nft
sudo nft list ruleset
```

## Layer 3: the application

```nginx
server {
    listen 127.0.0.1:8080;   # local only
    ...
}
```

The DB listens on `127.0.0.1:5432`, not `0.0.0.0`.

## Layer 4: logging and IDS

- auditd on critical files;
- fail2ban on auth.log;
- a central SIEM (out of scope for this course).

## Default deny

| Policy | Risk |
|----------|------|
| default allow | a forgotten service = open to the world |
| default deny | you must explicitly open each port |

## Checklist

- Name 3 layers for srv1.
- Why ufw **and** a cloud SG?
- What listens on `0.0.0.0` on the host — how do you check?

Next lesson: [05. Lab: firewall](05-lab-firewall-depth.md).
