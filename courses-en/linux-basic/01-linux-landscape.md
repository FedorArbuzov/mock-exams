# 01. Distributions, the FHS, and documentation

## What "Linux" actually means

When a colleague says "we run Linux on the server," they usually mean a **distribution** — a complete package: kernel, system utilities, package manager, security policies, and default services.

**Linux**, strictly speaking, is just the **kernel**: the scheduler, memory management, networking, drivers. There's one kernel, but "Ubuntu" and "Rocky Linux" are different **distributions** built on top of it. This matters for DevOps work: your CI image might be `ubuntu:24.04`, your Kubernetes nodes might run Container-Optimized OS or RHEL, and legacy systems might still be on CentOS 7. The commands are mostly the same, but config paths, service names, and the package manager differ.

Our test bed runs **Ubuntu 24.04 LTS** (Long Term Support): predictable security updates for years, huge amounts of documentation, and familiar `apt`.

| Family | Examples | Packages | Where you'll see it |
|-----------|---------|--------|------------------|
| Debian | Ubuntu, Debian | `apt`, `dpkg` | Cloud, containers, startups |
| RHEL | Rocky, Alma, RHEL | `dnf`, `rpm` | Enterprise, banks, vendors |

If you're used to Ubuntu, the same ideas apply on RHEL (systemd, `/etc`, users), but instead of `apt install nginx` you'd run `dnf install nginx`, and the sudo group is often called **wheel**.

## The FHS — "where things live"

The **FHS** (Filesystem Hierarchy Standard) is a convention so that no admin has to go hunting for the nginx config in `/tmp`. In production you're constantly doing `cd /etc/...`, checking logs in `/var/log`, and finding application data in `/var/lib`.

| Path | Purpose | DevOps example |
|------|------------|-------------------|
| `/` | Root of the whole filesystem | `df -h /` when "disk is full" |
| `/etc` | Configuration | `sshd_config`, systemd units |
| `/var` | Changing data | logs, queues, databases |
| `/var/log` | Logs | `journalctl`, nginx access.log |
| `/home` | Home directories | SSH keys, dotfiles |
| `/tmp` | Temporary files | often cleared; don't store anything important |
| `/usr/bin` | Programs from packages | `python3`, `curl` |
| `/proc`, `/sys` | Interface to the kernel | `cat /proc/cpuinfo` |
| `/dev` | Devices | disks, pseudo-terminals |
| `/root` | Superuser's home | root only |

**Practical rule:** edit configs in `/etc`, check service state through systemd and `/var/log`, and never hand-copy binaries into `/usr/bin` — install them as a package.

A classic interview question: "where's the nginx config?" — on Ubuntu, after `apt install nginx`, it's `/etc/nginx/nginx.conf`, with sites under `/etc/nginx/sites-enabled/`.

## Who you are on the system

The first commands to run in any new environment:

```bash
whoami
id
echo $SHELL
echo $HOME
hostname
```

`whoami` shows your current login. `id` shows your UID, primary group, and **all** your groups (important for sudo and docker). `$SHELL` is your default shell — in this course, that's **bash** (`/bin/bash`).

## Documentation at hand — man and beyond

On a server without internet access, **man** is your friend. No need to google `tar` syntax when `man tar` is right there.

```bash
man ls
man 5 passwd      # section 5 = file formats, not commands
man -k password   # search descriptions by keyword
```

The man sections an admin actually needs:

| Section | Content | Example |
|--------|------------|--------|
| 1 | User commands | `man systemctl` |
| 5 | Config file formats | `man 5 crontab` |
| 8 | Administration | `man 8 mount` |

Bash builtins (`cd`, `export`) have no binary under `/usr/bin`, so for those use:

```bash
help cd
```

A quick reference for a flag:

```bash
ls --help | less
apropos mount
whatis systemd
```

Build the habit: before experimenting with an unfamiliar flag, check `man` or `--help` instead of guessing.

## Version and "what machine is this"

```bash
cat /etc/os-release
uname -r
uname -a
```

`/etc/os-release` gives you the human-readable distribution name. `uname -r` gives the **kernel** version (important when chasing driver bugs or eBPF issues). Support tickets usually need both.

## How this connects to the rest of the course

Later lessons build on the FHS: logs in the journal ([11](11-journald.md)), packages via apt ([08](08-packages-apt.md)), ssh configs in `/etc/ssh`. If you mix up `/etc` and `/usr/local/etc`, come back to the table above.

## Checklist

- Explain to a colleague the difference between **kernel** and **distribution**
- Name three directories to check when "the service won't start" (`/etc`, `/var/log`, sometimes `/var/lib`)
- Open the man page for the `/etc/passwd` format (`man 5 passwd`)
- Find the OS version with a single command

Next lesson: [02. Shell and redirection](02-shell-redirection.md).
