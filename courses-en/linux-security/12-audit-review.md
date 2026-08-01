# 12. Security audit review

## Review goal

Before handing srv1 into “pseudo-prod” — walk the **checklist** and record findings.

## SSH checklist

```bash
sshd -T | grep -E 'permitroot|passwordauth|pubkey|maxauth'
grep -r PermitRootLogin /etc/ssh/sshd_config.d/ /etc/ssh/sshd_config
```

## Users checklist

```bash
awk -F: '($2==""){print "empty password:", $1}' /etc/shadow
awk -F: '($3==0){print "uid0:", $1}' /etc/passwd
last -a | head
```

## Network checklist

```bash
ss -tlnp
sudo ufw status verbose
```

Are unnecessary 0.0.0.0:* listeners closed?

## SUID checklist

```bash
find /usr -perm -4000 -type f 2>/dev/null
```

Every setuid binary needs a justification.

## Updates checklist

```bash
apt list --upgradable 2>/dev/null | head
```

## Logs checklist

```bash
sudo ausearch -ts today 2>/dev/null | tail
journalctl -p err -b --no-pager | tail
```

## Severity

| Level | Example |
|---------|--------|
| Critical | root SSH, open Docker API |
| High | password auth on |
| Medium | no fail2ban |
| Low | missing banner |

## Finding template

```markdown
### FINDING-01: PasswordAuthentication yes
- Severity: High
- Evidence: sshd -T
- Remediation: set to no after keys
- Status: open
```

Next lesson: [13. Lab: report](13-lab-audit-report.md).
