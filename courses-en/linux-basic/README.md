# Linux — Basic

Basic Linux course for DevOps: shell, users, permissions, packages, **systemd**, disks, **LVM**, **SSH**, cron.

> Start of the DevOps path: [`devops-path.md`](../devops-path.md). Next — [`linux-intermediate`](../linux-intermediate/README.md), in parallel [`gitlab-basic`](../gitlab-basic/README.md). Before Kubernetes: [`containers-basic`](../containers-basic/README.md) (Dockerfile, compose, registry).

**Locally:** [`deploy/linux`](../../deploy/linux/README.md) — `docker compose up -d`.

## Curriculum

### Environment and basics

| # | Lesson |
|---|------|
| 00 | [Docker lab environment](00-docker-lab-environment.md) |
| 01 | [Distributions and FHS](01-linux-landscape.md) |
| 02 | [Shell and redirection](02-shell-redirection.md) |
| 02 | [Lab: shell](02-lab-shell.md) |
| 03 | [Users and groups](03-users-groups.md) |
| 03 | [Lab: users](03-lab-users.md) |
| 04 | [rwx permissions](04-permissions.md) |
| 04 | [Lab: permissions](04-lab-permissions.md) |

### Files and packages

| 05–05 | find · lab |
| 06–06 | grep/awk · lab |
| 07–07 | vim · lab |
| 08–08 | apt · lab |

### Processes and systemd

| 09–12 | processes, systemd, journal, cron (+ labs) |

### Disks and access

| 13–16 | mount, LVM, tar/rsync, SSH (+ labs) |

### Operations

| 17–17 | troubleshooting (+ lab) |
| 18 | [Final project](18-final-project.md) |

Lesson files: `00` … `18` in the `courses/linux-basic/` directory.

## What you should end up with

- Work in the shell, manage users and permissions
- Create systemd units and cron jobs, read the journal
- Mount volumes, LVM on loop devices, copy over SSH/rsync
- Build a "mini-server" on srv1 (final)

## Related courses

| Course | Relation |
|------|-------|
| `bare-metal` | RAID/BMC — theory after basic |
| `gitlab-basic` | shell for CI |
| `kuber-basic` | containers on top of Linux |
| `linux-shell` | specialization after basic |
