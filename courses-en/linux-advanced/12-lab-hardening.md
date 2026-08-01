# 12. Lab: hardening srv1

## Lab goal

Go through the **CIS-lite checklist** on **srv1**, apply a minimal set of sysctl, verify that **SSH from lab via key** still works, and leave a `hardening-done.txt` marker for the capstone.

## Prerequisites

- [11. Hardening](11-hardening.md).
- Access: `ssh course@172.28.0.11` from lab.

---

## Preparing the stand

```bash
docker compose exec lab bash
ssh -o BatchMode=yes course@172.28.0.11 'hostname; whoami'
```

**If SSH fails:** restore the keys before hardening.

---

## Task 1. Checklist (fill it in)

On srv1, check off:

```bash
ssh course@172.28.0.11
```

- [ ] `PermitRootLogin no` (or prohibit-password)
- [ ] `PasswordAuthentication no` **or** deliberately yes only in lab
- [ ] ufw **active** or nft policy documented
- [ ] no empty passwords in shadow
- [ ] only expected UID 0
- [ ] `dpkg -l | wc -l` — a deliberate set of packages

Commands:

```bash
grep -E '^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)' /etc/ssh/sshd_config
sudo ufw status 2>/dev/null || echo "ufw not installed"
sudo awk -F: '($2==""){print}' /etc/shadow
awk -F: '$3==0 {print}' /etc/passwd
```

---

## Task 2. sysctl hardening

```bash
echo 'kernel.kptr_restrict=1
kernel.dmesg_restrict=1' | sudo tee /etc/sysctl.d/99-harden.conf
sudo sysctl -p /etc/sysctl.d/99-harden.conf
sysctl kernel.kptr_restrict kernel.dmesg_restrict
```

---

## Task 3. ufw (if not enabled yet)

**Keep a second SSH session.**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw --force enable
sudo ufw status numbered
```

From **lab**, verify:

```bash
ssh -o BatchMode=yes course@172.28.0.11 'echo ssh-ok'
curl -s -o /dev/null -w "http=%{http_code}\n" http://172.28.0.11/ 2>/dev/null || echo "nginx optional"
```

---

## Task 4. Report on srv1

```bash
echo "hardening lab12 applied $(date -Is) by $(whoami)" | sudo tee /root/hardening-done.txt
sudo chmod 600 /root/hardening-done.txt
sudo ls -la /root/hardening-done.txt
```

---

## Task 5. Short report on lab

```bash
ssh course@172.28.0.11 'sudo cat /root/hardening-done.txt' > /tmp/hardening-report.txt
cat /tmp/hardening-report.txt
```

---

## Success criteria

- [ ] Checklist filled in (in your notes or as comments)
- [ ] sysctl applied
- [ ] SSH from lab works after ufw (if enabled)
- [ ] `/root/hardening-done.txt` created

## What to take to work

- Hardening without verifying SSH = an incident.
- Baseline in git (Ansible), not manual "permanent" edits.
- The capstone brings hardening + audit + fail2ban together.

Next lesson: [13. fail2ban](13-fail2ban.md).
