# 33. Backup strategy

## Intro: you have a backup, but no restore

"Everything is in S3" — good. The question during an incident at 03:00: **how do you bring PostgreSQL back from backup in 2 hours, what's the password, and what's the WAL order?** If the last **restore drill** was three years ago, your RTO on paper doesn't exist.

A backup without a **verified restore** is hope, not a strategy. This chapter connects the terms RPO/RTO with what you've already done in basic (`tar`, cron) and what you'll assemble in the [finale](34-final-project.md).

## What you'll learn

- The **3-2-1** rule and what's really critical about it.
- **RPO** and **RTO** in plain words and examples.
- What to back up on a Linux host vs in the application/DB.
- **Restore drill** — why and how often.
- Common failures (a snapshot without consistency, a backup on the same disk).

---

## 3-2-1

| Number | Meaning | Practice |
|-------|--------|----------|
| **3** | three copies of the data | prod + local backup + offsite |
| **2** | two types of media | disk + object storage / tape |
| **1** | one **offsite** copy | another data center, region, account |

In practice, also add as mandatory:

- **encryption** at rest and in transit;
- **access control** (a backup = all of the company's secrets);
- a **restore test** on a schedule.

---

## RPO and RTO

| Term | Question | Example |
|--------|--------|--------|
| **RPO** (Recovery Point Objective) | how much data **can you lose**? | cron `tar /etc` every hour → up to 1 h of configs |
| **RTO** (Recovery Time Objective) | how long to **bring the service back up**? | 4 h — only if a drill showed 3.5 h |

**RPO** sets the backup frequency and replication. **RTO** sets the runbook, the hardware, and the restore parallelism.

You can't promise an RTO of 15 minutes if the drill took 6 hours.

---

## What to back up (layers)

| Object | Tool | Frequency | Note |
|--------|------------|---------|---------|
| `/etc`, unit files | tar, git, Ansible | on change | fast, little space |
| Code / IaC | git | every commit | not a replacement for data |
| Application files | rsync, snapshot | hourly/daily | coordinate with the app |
| **PostgreSQL** | `pg_dump`, basebackup + **WAL** | continuous + full | tar-ing only the DB won't save you |
| **MySQL** | xtrabackup, binlog | per policy | |
| VM disk | cloud snapshot | daily | **crash-consistent** vs **app-consistent** |

Example of a host layer (training):

```bash
sudo tar -czvf "/backup/etc-$(date +%F).tar.gz" /etc/nginx /etc/letsencrypt 2>/dev/null
```

Offsite (concept):

```bash
rsync -avz -e ssh /backup/ backup@collector.example.com:/archives/$(hostname)/
```

---

## Consistency: why "just a snapshot" is dangerous

| Type | Description | Risk |
|-----|----------|------|
| Crash-consistent | the disk as if the power was cut | a corrupted DB on restore |
| App-consistent | quiesce / flush the DB, then snapshot | preferable |
| Logical backup | pg_dump, mysqldump | slower, easier to verify |

For Postgres in production: **WAL archiving** + a periodic base backup, restore via `pg_basebackup` + replay.

---

## Encryption and access

Backups contain passwords, keys, personal data, TLS private keys.

- Encrypt at rest: S3 SSE-KMS, gpg, Borg restic.
- IAM / RBAC: minimize who can **read** the backup bucket.
- **Not** a public S3 bucket — a regular source of leaks.

```bash
# example of local encryption (lab)
gpg --symmetric --cipher-algo AES256 backup.tar.gz
```

---

## Restore drill (procedure)

Once a quarter or after a major change:

1. Bring up an **isolated** VM / namespace.
2. Restore the **latest** full + apply the incremental/WAL per the runbook.
3. Smoke test: health endpoint, migrations, login.
4. Record the **actual time**, problems, and differences from the documentation.
5. Update the runbook and the alerts (backup job failed).

A one-line checklist in the ticket: "restore tested 2026-05-18, RTO 95 min".

---

## Monitoring backups

| Signal | Action |
|--------|----------|
| cron didn't run | alert on the absence of a fresh file |
| the backup size dropped 10x | check for a dump error |
| S3 lifecycle deleted it too early | retention policy review |

```bash
find /backup -name '*.tar.gz' -mtime -2 -ls
```

---

## Connection with the final project

On srv1 in basic you set up cron + `tar` for nginx → `/backup`. In [34-final-project](34-final-project.md) this becomes part of the runbook together with ufw, proxy, and logs — a **single** operational picture.

---

## Common mistakes

| Mistake | Risk |
|--------|------|
| only a VM snapshot without app quiesce | an unrecoverable DB |
| a backup on the same disk / same AZ | a fire / disk loss wipes out everything |
| no monitoring of the backup job | a silent fail for months |
| you have a backup, no runbook | panic during restore |
| secrets in an unencrypted tar in /tmp | a leak |

---

## In production

Velero (Kubernetes), Restic/Borg, cloud snapshots + **cross-region** replication. Compliance: retention, immutability (WORM), an audit of who downloaded a backup.

---

## Summary

A backup = a copy + a **verified** restore + offsite + encryption. RPO/RTO are business requirements, not numbers from a slide deck. The host (`tar`/`rsync`) and the application (dump/WAL) are **different** layers.

## Checklist

- [ ] How does RPO differ from RTO?
- [ ] Why doesn't `tar /etc` save Postgres?
- [ ] When was your last restore test?
- [ ] Where does the offsite copy live, and who has access?

Next lesson: [34. Final project](34-final-project.md).
