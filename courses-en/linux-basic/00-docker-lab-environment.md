# 00. The Docker lab environment

## Why a separate test bed

At work you'll most often reach Linux through **SSH** into an already-configured server, or through a **container** in CI. You rarely need to install an OS "from scratch" on a laptop — but you always need to **know your way around the system**: permissions, services, network, logs.

This course builds that same habit: **one lab environment** shared across all lessons in `linux-basic`, `linux-intermediate`, and part of `linux-advanced`. You bring it up with a single Docker Compose command — no separate VM, no dual boot, and WSL isn't strictly required (though on Windows, Docker Desktop actually uses WSL2 under the hood).

The full description of the test bed lives in [`deploy/linux`](../../deploy/linux/README.md). If something won't start, begin there — it has troubleshooting steps, ports, and credentials.

## Topology — who talks to whom

Picture a mini data center of five "machines" on one Docker network, `172.28.0.0/24`. You'll almost always log into **lab** — your admin workstation. The other containers play the role of servers you reach over SSH, HTTP, or DNS.

```text
                    ┌─────────────┐
   you ──exec──►    │ lab         │  172.28.0.10
                    └──────┬──────┘
           SSH / HTTP     │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    srv1 (.11)      srv2 (.12)       web (.20)
         │                                 │
         └──────────── DNS (.53) ─────────┘
```

| Container | IP | Role in the course |
|-----------|-----|----------------|
| **lab** | 172.28.0.10 | Entry point: bash, config edits, running clients |
| **srv1** | 172.28.0.11 | "Prod-like" host: Apache, Postfix, LVM labs |
| **srv2** | 172.28.0.12 | Second node: srv1/srv2 pairs, keepalived (advanced) |
| **web** | 172.28.0.20 | Nginx, TLS, reverse proxy |
| **dns** | 172.28.0.53 | BIND, the `lab.local` zone |

Names like `srv1.lab.local` show up in the intermediate course, once you set up resolution through dns.

## Starting from scratch

From the repo root (or from the directory containing `deploy/linux`):

```bash
cd deploy/linux
docker compose build
docker compose up -d
docker compose ps
```

**The first run** can take a few minutes: it pulls the image, installs packages, and brings up **systemd** inside the containers. Wait 30–60 seconds and check `ps` again — every service should show `Up`, not `Restarting`.

If `build` fails with a daemon error, on Windows/macOS **start Docker Desktop** and wait for the green "Engine running" status.

## Getting into the lab

The main way in is an interactive shell inside the lab container:

```bash
docker compose exec lab bash
```

Inside, you might be **root** or the **course** user — each lesson will say explicitly which one to use. For privileged operations, use `sudo` (password below).

These training credentials are **for the test bed only** — never reuse passwords like these in production:

| User | Password | Used for |
|--------------|--------|--------|
| course | course | SSH to srv1/srv2, sudo in labs |
| root | (often no password inside the container) | Full access inside the container |

## Quick "is everything alive" check

Run this from inside lab (after `exec`-ing in):

```bash
ping -c2 172.28.0.11
ssh course@172.28.0.11 hostname
```

On the **first** SSH connection, OpenSSH will ask about the fingerprint — in this training environment, answer `yes`. If you get `Connection refused`, wait another minute: sshd on srv1 may not have started yet.

A good habit for the whole course: before a lab, `ping` or `ssh` to the target IP once — don't waste time debugging a "broken" exercise when the network just hasn't come up yet.

## Docker's limits — setting expectations honestly

The test bed is **deliberately** close to a real server (systemd, ssh, apt, nginx, LVM on loop disks), but it isn't real hardware:

| Works fine in the test bed | Don't expect |
|------------------------------|--------------|
| systemd, unit files, journal | Real RAID and disk hot-swap |
| ssh, cron, firewall (nft/ufw) | GRUB bootloader and PXE "like in a real data center" |
| LVM on backing files | Hardware driver behavior |
| Networking between containers | An exact copy of production latency/MTU |

**Bare metal** topics (BMC, racks, PXE, hardware RAID) live in a separate track: [`bare-metal`](../bare-metal/README.md). You can read the theory there without mandatory Docker labs.

## Resetting when you've broken everything

Experiments with `chmod`, the firewall, or `/etc/ssh/sshd_config` can sometimes leave the system in a strange state. The fastest way back:

```bash
cd deploy/linux
docker compose down -v
docker compose up -d --build
```

The `-v` flag removes the volumes — **all your files inside the containers** will be gone. That's fine for a training environment; just keep your own notes and scripts in the repo on the host, not only in the container's `/tmp`.

## Checklist before lesson 01

- [ ] `docker compose ps` shows containers as Up
- [ ] You can get into lab via `docker compose exec lab bash`
- [ ] `ping` to 172.28.0.11 succeeds
- [ ] You remember: course / course for SSH and sudo in the labs
- [ ] You know where the test bed's README is if something breaks

Next lesson: [01. Distributions and the FHS](01-linux-landscape.md).
