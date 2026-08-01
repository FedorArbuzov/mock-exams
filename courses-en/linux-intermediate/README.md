# Linux — Intermediate

Intermediate level: **networking**, **DNS**, **firewall**, **TLS**, **web servers**, **NFS**, **mail/logs**, **sudo/PAM**, **diagnostics**.

**Prerequisites:** [`linux-basic`](../linux-basic/README.md).

**Locally:** [`deploy/linux`](../../deploy/linux/README.md) — `docker compose up -d`, log in with: `docker compose exec lab bash`.

**Next:** [`linux-advanced`](../linux-advanced/README.md), [`kuber-basic`](../kuber-basic/README.md). Deeper networking (L3–L7, BGP, overlay, VPC): [`networking-deep`](../networking-deep/README.md).

## How to read the chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within a pair:

1. Read the **theory** (01, 03, 05…) — don't skip the intro and the "common mistakes" table.
2. Open the **lab** (02-lab, 04-lab…) with the environment running via `docker compose up -d`.
3. Complete the tasks **in order**; after each one, cross-check the "what you'll see" block against your terminal.
4. If something doesn't add up — check the "if it doesn't work" section, then [`deploy/linux/README.md`](../../deploy/linux/README.md).

**Theory structure:** intro (a scenario from work) → what you'll learn → concepts and commands with explanations → example on the environment → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → setup → tasks 1…N (why / commands / what you'll see / if it broke) → success criteria → what to take to work.

**Time:** about **45–60 minutes** for a "theory + lab" pair; the [final project](34-final-project.md) is **2–4 hours**.

**IP cheat sheet** (keep it handy):

| Host | IP |
|------|-----|
| lab | 172.28.0.10 |
| srv1 | 172.28.0.11 |
| srv2 | 172.28.0.12 |
| web | 172.28.0.20 |
| dns | 172.28.0.53 |

SSH account: **course** / **course**.

## Curriculum

### Networking (01–12)

1. [TCP/IP](01-tcp-ip.md) · 2. [Lab: ip](02-lab-ip.md)
3. [DNS](03-dns.md) · 4. [Lab: DNS](04-lab-dns.md)
5. [NAT](05-nat-forwarding.md) · 6. [Lab: NAT](06-lab-nat.md)
7. [Firewall](07-firewall.md) · 8. [Lab: ufw](08-lab-firewall.md)
9. [TLS / openssl](09-tls-openssl.md) · 10. [Lab: HTTPS](10-lab-tls.md)
11. [ss / tcpdump](11-network-debug.md) · 12. [Lab: tcpdump](12-lab-tcpdump.md)

### Services (13–22)

13. [nginx](13-nginx.md) · 14. [Lab: reverse proxy](14-lab-nginx.md)
15. [Apache](15-apache.md) · 16. [Lab: Apache](16-lab-apache.md)
17. [NFS](17-nfs.md) · 18. [Lab: NFS](18-lab-nfs.md)
19. [Postfix](19-postfix.md) · 20. [Lab: mail](20-lab-postfix.md)
21. [rsyslog](21-rsyslog.md) · 22. [Lab: rsyslog](22-lab-rsyslog.md)

### Security and ACL (23–28)

23. [sudo](23-sudo.md) · 24. [Lab: sudo](24-lab-sudo.md)
25. [PAM](25-pam.md) · 26. [Lab: PAM](26-lab-pam.md)
27. [ACL / AppArmor](27-acl-apparmor.md) · 28. [Lab: ACL](28-lab-acl.md)

### Performance and finale (29–34)

29. [Performance tools](29-performance.md) · 30. [Lab: stress](30-lab-performance.md)
31. [strace / lsof](31-strace-lsof.md) · 32. [Lab: strace](32-lab-strace.md)
33. [Backup strategy](33-backup-strategy.md)
34. [Final project](34-final-project.md)

## What you should end up with

- Diagnosing the network layer by layer: route → port → HTTP → dump.
- Configuring DNS, ufw, and TLS on the training hosts.
- Bringing up an nginx reverse proxy and NFS (or a tar-based backup).
- Restricting sudo, reading rsyslog/journal.
- Assembling the [final mini-stack](34-final-project.md) on srv1 + lab.

## Specializations

| Course | When |
|------|-------|
| [`linux-security`](../linux-security/README.md) | hardening, audit — after intermediate |
| [`linux-shell`](../linux-shell/README.md) | scripts and automation — in parallel |
