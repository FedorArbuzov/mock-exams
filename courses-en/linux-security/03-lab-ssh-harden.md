# 03. Lab: hardening sshd on srv1

**Stand:** [`deploy/linux`](../../deploy/linux/README.md).

## Warning

Keep **two** terminals: one for edits, the second for verification. Otherwise you can lose access.

## Task 1. Backup

```bash
ssh course@172.28.0.11
sudo cp -a /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%s)
sudo mkdir -p /etc/ssh/sshd_config.d
```

## Task 2. Drop-in config

```bash
sudo tee /etc/ssh/sshd_config.d/99-lab-harden.conf <<'EOF'
PermitRootLogin no
MaxAuthTries 3
LoginGraceTime 30
# PasswordAuthentication no   # enable after verifying keys!
EOF
sudo sshd -t
```

## Task 3. Reload

```bash
sudo systemctl reload ssh
```

In a **new** window from lab:

```bash
ssh -i ~/.ssh/id_lab course@172.28.0.11 hostname
```

## Task 4. Check root

```bash
ssh root@172.28.0.11 2>&1 | head -3
```

It should be refused.

## Task 5. (After keys) disable the password

Once key login is stable:

```bash
echo 'PasswordAuthentication no' | sudo tee -a /etc/ssh/sshd_config.d/99-lab-harden.conf
sudo sshd -t && sudo systemctl reload ssh
```

## Success criteria

- [ ] sshd -t with no errors
- [ ] course login by key works
- [ ] root login rejected

Next lesson: [04. Defense in depth](04-firewall-depth.md).
