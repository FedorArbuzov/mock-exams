# 19. Postfix: local mail

## Intro: "cron failed" — but you don't read the emails

A cron job fired overnight:

```text
/bin/sh: 1: /usr/local/bin/backup.sh: not found
```

By default cron emails **root** with the job's output. If you haven't set up mail, the email:

- lands in `/var/mail/root` (and accumulates gigabytes over the years),
- or piles up in the Postfix queue,
- or is lost — and you learn about the problem only when the disk fills up.

**Postfix** is the default MTA (Mail Transfer Agent) on Ubuntu: it accepts a message locally and delivers it to a mailbox or forwards it to a **relay** (SendGrid, SES).

A DevOps engineer doesn't need to be a mail admin, but does need to: **send a test**, **read mail.log**, and **understand that cron sends mail**.

## What you'll learn

- Why an MTA is needed on a server without "real" mail.
- The path of a message: `mail` → postfix → mailbox.
- The files **main.cf**, the queue **mailq**, the log **mail.log**.
- How **local only** differs from **relay** in prod.
- How not to become an **open relay** (spam relay).

## The path of a message — step by step

```mermaid
flowchart LR
  Cron[cron job fails]
  Mail[mail command]
  Postfix[postfix]
  Mbox["/var/mail/user"]
  Cron -->|stderr| Mail
  Mail --> Postfix
  Postfix --> Mbox
```

1. Cron runs the script, stderr goes to mail.
2. The `mail` command hands the message to Postfix via the sendmail API.
3. Postfix checks: is the recipient `root@hostname` **local**?
4. If yes — it puts it in `/var/mail/root` (mbox format) or Maildir.
5. If no — it looks up the MX in DNS or sends to the **relayhost**.

## Installation on Ubuntu

```bash
sudo apt update
sudo apt install -y postfix mailutils
```

Debconf will ask for the type:

| Option | When |
|---------|--------|
| **Local only** | lab, only cron → root |
| **Internet Site** | needs an FQDN, a relay later |
| **No configuration** | you'll configure main.cf manually |

```bash
sudo systemctl enable --now postfix
sudo systemctl status postfix
sudo postfix check
```

`postfix check` — config syntax **before** reload.

## Send a test email

```bash
echo "Message body. Time: $(date -Is)" | mail -s "Subject: lab test" $(whoami)
```

Check the queue:

```bash
mailq
```

Empty or `Mail queue is empty` — delivered locally.

Read the mailbox (a simple way):

```bash
sudo ls -la /var/mail/
sudo grep -a . /var/mail/$(whoami) 2>/dev/null | tail -15
```

Or install `mutt` and `mutt -f /var/mail/$(whoami)`.

## Logs — the main source of truth

```bash
sudo tail -30 /var/log/mail.log
sudo journalctl -u postfix --no-pager -n 20
```

Look for:

```text
status=sent
delivered to mailbox
```

On error:

```text
deferred
Connection timed out
```

## main.cf — three parameters for orientation

```bash
postconf myhostname
postconf mydomain
postconf mydestination
postconf relayhost
```

| Parameter | Meaning |
|----------|--------|
| `myhostname` | this machine's name (FQDN is better) |
| `mydestination` | which domains to treat as **local** |
| `relayhost` | where to send everything outbound (empty = itself) |

An **open relay** is when your server accepts mail **from the internet** and forwards it anywhere. Spammers love these. In the lab — **local only**, don't open `mynetworks` to 0.0.0.0/0.

## Relay in prod (concept)

```text
# /etc/postfix/main.cf fragment
relayhost = [smtp.sendgrid.net]:587
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_tls_security_level = encrypt
```

```bash
# /etc/postfix/sasl_passwd
[smtp.sendgrid.net]:587    apikey:SECRET
sudo chmod 600 /etc/postfix/sasl_passwd
sudo postmap /etc/postfix/sasl_passwd
sudo systemctl reload postfix
```

Secrets — not in git. Alternatives: Amazon SES, corporate SMTP.

## Connection to cron

```bash
grep -r MAILTO /etc/cron* 2>/dev/null
```

By default cron emails **root**. You can set:

```text
MAILTO=devops@company.com
```

in the crontab — but you need a working relay.

## On the stand

[Lab 20](20-lab-postfix.md) — srv1 or lab, local delivery. Outbound SMTP in Docker is often **closed** — that's normal.

## Common mistakes

| Symptom | Cause | Action |
|---------|---------|----------|
| mailq grows | no relay, internet closed | local only or relay |
| Empty /var/mail | alias root → /dev/null | `/etc/aliases` |
| Connection refused | postfix down | systemctl start |
| Outbound mail in spam | no SPF/DKIM | configure at the relay |

## In production

- Alerts — in Prometheus/Grafana, not just mail to root.
- Outbound mail — through **one** relay with authentication.
- Monitor the size of `/var/mail` and `mailq`.

## Summary

Postfix delivers local mail (cron, at, scripts) and can forward outbound via a relay. Check **mailq** and **mail.log**. For the lab — **local only**. An open relay is unacceptable. Mail to root is often the only "monitoring" on a forgotten server — check the mailbox or disable it deliberately.

## Checklist

- Where does cron send stderr by default?
- What does `mailq` show when the relay has a problem?
- Why is an open relay dangerous?
- Why `postfix check`?

Next lesson: [20. Lab: mail](20-lab-postfix.md).
