# 10. systemd: units, targets, dependencies

## Why it's the center of modern Linux

Services used to be started by scripts in `/etc/init.d`. Now it's **systemd** — the init (PID 1 in a container/VM), the service manager, timers, and part of networking. You'll constantly do:

```bash
systemctl status nginx
systemctl restart myapp
journalctl -u myapp
```

If a service "won't start" — look at `status` and `journalctl`, don't reboot the machine out of habit.

## Basic commands

```bash
systemctl status ssh
systemctl is-active ssh
systemctl is-enabled ssh
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx      # if supported (reread config)
sudo systemctl enable nginx      # autostart
sudo systemctl disable nginx
sudo systemctl daemon-reload     # after editing unit files
```

| Command | Meaning |
|---------|--------|
| `start` / `stop` | one-off start/stop |
| `restart` | stop + start |
| `reload` | softly reread the config (not all services) |
| `enable` | symlink into a target at boot |
| `daemon-reload` | reread unit files from disk |

## Unit types

| Suffix | Example | Purpose |
|---------|--------|------------|
| `.service` | nginx.service | daemon or application |
| `.socket` | docker.socket | socket activation |
| `.timer` | apt-daily.timer | schedule (cron analog) |
| `.target` | multi-user.target | group of units (boot level) |
| `.mount` | mnt-data.mount | mount point |

```bash
systemctl list-units --type=service --state=running | head
systemctl get-default
```

## Where unit files live

| Directory | Who writes there |
|---------|---------|
| `/usr/lib/systemd/system/` | packages (apt) |
| `/etc/systemd/system/` | admin, override |

Put **your own** unit in `/etc/systemd/system/` so a package update doesn't overwrite the file.

Example of a simple service:

```ini
[Unit]
Description=Lab demo app
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/lab-app.sh
Restart=on-failure
User=course

[Install]
WantedBy=multi-user.target
```

| Section | Important fields |
|--------|-------------|
| Unit | `Description`, `After`, `Requires`, `Wants` |
| Service | `ExecStart`, `Type`, `User`, `Restart`, `Environment` |
| Install | `WantedBy` — which target to enable it in |

**Type=oneshot** — the command ran and finished (a migration script). **Type=simple** — a long-lived process (the default for many daemons).

After editing:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lab-app.service
```

## Targets — "runlevels"

| Target | Usually |
|--------|--------|
| multi-user.target | server without a GUI |
| graphical.target | workstation with a GUI |

`systemctl isolate multi-user.target` — careful on a desktop.

## Dependencies — don't confuse After and Requires

- `After=network.target` — start **later** (ordering), the network may still be "not ready".
- `Requires=network-online.target` — a hard dependency; a failing dependency stops the unit.
- `Wants=` — a soft dependency.

In the Docker lab the network is "there" quickly; on hardware, `network-online` matters for NFS and clusters.

## Example in the repository

[examples/systemd/lab-hello.service](examples/systemd/lab-hello.service) — a oneshot for lab 10.

## Checklist

- Why `daemon-reload` after editing a unit?
- How does `reload` of nginx differ from `restart`?
- Where do you put your own unit so apt won't overwrite it?

Next lesson: [10. Lab: systemd](10-lab-systemd.md).
