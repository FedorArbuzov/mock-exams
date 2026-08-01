# 06. AIDE — file integrity monitoring (FIM)

## File Integrity Monitoring

**FIM** answers the question: *did a critical file change without a change ticket?*

Typical targets:

- `/etc/passwd`, `/etc/shadow`, `/etc/sudoers`
- `/usr/bin/sudo`, `/usr/sbin/sshd`
- binaries in PATH after a compromise

## AIDE

```bash
sudo apt install -y aide aide-common
sudo aideinit    # the initial database — slow
```

Database: `/var/lib/aide/aide.db`.

```bash
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
sudo aide --check
```

Output: Added/Removed/changed files.

## Configuration

`/etc/aide/aide.conf` — which trees to scan:

```text
/etc       p+i+n+u+g+s+m+c+md5
/usr/bin   p+i+n+u+g+s+m+c+md5
```

After editing the config — rebuild the database.

## Cron

```bash
# /etc/cron.daily/aide
aide --check | mail -s "AIDE report" root
```

## Limitations

| Downside | Comment |
|-------|-------------|
| False positives | after an apt upgrade |
| Not real-time | only on a schedule |
| Doesn't catch in-memory malware | needs an EDR |

Alternatives: **Tripwire**, **OSSEC**, **Wazuh**, cloud **Integrity Monitoring**.

## Checklist

- How does FIM differ from auditd?
- When should you rebuild the database?
- Why are there many changed files after a patch?

Next lesson: [07. Secrets on disk](07-secrets-disk.md).
