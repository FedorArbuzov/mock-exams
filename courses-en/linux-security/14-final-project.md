# 14. Final project: hardened srv1

## Goal

Apply the **entire** `linux-security` course on **srv1** and submit a report + demo.

## Mandatory controls

| # | Control | Verification |
|---|----------|----------|
| 1 | SSH: PermitRootLogin no, MaxAuthTries 3 | `sshd -T` |
| 2 | SSH: key-based login from lab | `ssh -i key deploy@...` |
| 3 | ufw: deny in, allow 22,80,(443) | `ufw status` |
| 4 | fail2ban jail sshd | `fail2ban-client status sshd` |
| 5 | auditd on sudoers or sshd_config | `ausearch` |
| 6 | Secrets: no 644 .env under /home | `find` |
| 7 | PKI: self-signed HTTPS **or** document why not | `curl -k` |
| 8 | Report `security-audit-srv1.md` | ≥ 5 findings |

## Demo (from lab)

```bash
# 1. ports
nmap -p 22,80,443,3306,5432 172.28.0.11 2>/dev/null || ss -tln | grep 172.28

# 2. http
curl -s -o /dev/null -w '%{http_code}\n' http://172.28.0.11/

# 3. ssh hardening
ssh course@172.28.0.11 'sudo sshd -T | grep -Ei "permitroot|passwordauth"'

# 4. fail2ban
ssh course@172.28.0.11 'sudo fail2ban-client status sshd 2>/dev/null | head -5'
```

## HANDOFF.md

On srv1 `/home/deploy/HANDOFF.md`:

- IP, user roles;
- how to rotate the CI key;
- on-call contacts (training);
- link to the disk-full runbook from [linux-advanced](../linux-advanced/24-runbook-lab.md).

## Submission criteria

- [ ] All 8 controls done or exception documented
- [ ] Report attached
- [ ] HANDOFF.md created

## Next

- [kuber-advanced](../kuber-advanced/README.md) — CKS-lite
- [gitlab-advanced](../gitlab-advanced/README.md) — SAST, container scanning
