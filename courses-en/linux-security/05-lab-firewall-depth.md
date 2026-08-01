# 05. Lab: firewall inventory

**Stand:** [`deploy/linux`](../../deploy/linux/README.md).

## Task 1. Listening sockets on srv1

```bash
ssh course@172.28.0.11 'sudo ss -tlnp'
```

Write down: port → process → whether it's needed from the outside.

## Task 2. ufw status

```bash
ssh course@172.28.0.11 'sudo ufw status verbose'
```

## Task 3. nft / iptables

```bash
ssh course@172.28.0.11 'sudo nft list ruleset 2>/dev/null | head -40 || sudo iptables -L -n | head -20'
```

## Task 4. A table in the report

Create `/tmp/firewall-inventory.md` on lab:

| Port | Service | Public? | Allowed by ufw? |
|------|---------|---------|---------------|
| 22 | ssh | yes | ... |
| 80 | nginx | yes | ... |

## Task 5. (Optional) apply nft

Only if you have a docker console and understand the risk:

```bash
# on srv1, if nft is available
sudo nft -f - <<'EOF'
flush ruleset
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    iif lo accept
    tcp dport 22 accept
    tcp dport 80 accept
  }
}
EOF
```

Verify SSH from lab **before** closing the session.

## Success criteria

- [ ] The port table is filled in
- [ ] You understand default deny vs allow

Next lesson: [06. AIDE](06-aide.md).
