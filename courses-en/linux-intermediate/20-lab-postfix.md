# 20. Lab: local Postfix mail

## Lab goal

Send an email to yourself via **mail**, see the delivery in **mail.log**, and understand where cron sends stderr. After the lab you won't ignore `/var/mail/root` on servers.

## Prerequisites

- [19. Postfix](19-postfix.md).
- srv1 or lab, sudo.

```bash
sudo apt update
sudo apt install -y postfix mailutils
# Debconf: Local only
sudo systemctl enable --now postfix
```

---

## Preparing the stand

```bash
sudo postfix check
systemctl is-active postfix
postconf myhostname mydestination | head -5
```

---

## Task 1. Test email

**Why:** to go through the path mail → postfix → mailbox.

```bash
echo "Message body. Time: $(date -Is). Host: $(hostname)" | \
  mail -s "Lab 20: postfix test" $(whoami)
sleep 3
mailq
```

**What you'll see:** `Mail queue is empty` — delivered locally.

**If mailq shows deferred:** see task 4 (logs).

---

## Task 2. Read the delivery

```bash
sudo tail -25 /var/log/mail.log
```

Look for `status=sent`, `delivered to mailbox`, your login.

```bash
sudo ls -la /var/mail/
sudo grep -a . /var/mail/$(whoami) 2>/dev/null | tail -10
```

**If /var/mail is empty:** the message may have gone to root — check `sudo grep -a . /var/mail/root 2>/dev/null | tail -5`.

---

## Task 3. journal (an alternative to the log)

```bash
sudo journalctl -u postfix --no-pager -n 15
```

---

## Task 4. Simulating cron (optional)

**Why:** to see where "mail from cron" comes from.

```bash
echo '* * * * * $(whoami) echo "cron body $(date +\%H\%M)" | mail -s "cron-sim" $(whoami)' | crontab -
sleep 70
mailq
sudo tail -5 /var/log/mail.log
crontab -r
```

Remove the crontab after the test (`crontab -r`).

---

## Task 5. Mail to root (optional)

```bash
echo "test root mail" | sudo mail -s "to root" root
sleep 2
sudo tail -5 /var/log/mail.log
sudo ls -la /var/mail/root
```

---

## Success criteria

- [ ] postfix active, `postfix check` OK
- [ ] mail.log contains status=sent/delivered
- [ ] mailq doesn't accumulate deferred
- [ ] Content found in /var/mail or confirmation in the log

## What to take away

- Cron failed → check mail to root and mail.log.
- mailq grows → relay/DNS/internet.

Next lesson: [21. rsyslog](21-rsyslog.md).
