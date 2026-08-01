# 08. apt and dpkg

## The package system — how you install software on a server

In the cloud, an AMI/Ubuntu image already contains a base. From there you do **not** download `.deb` files from a website by hand (unless there's an internal mirror); you tell the package manager: "install nginx, pull in the dependencies yourself". On Debian/Ubuntu this is **apt**; underneath is **dpkg**, which actually unpacks files into `/usr`, `/etc`, `/var`.

```text
you → apt / apt-get  →  repositories (HTTP)
         │                │
         └── dependencies, dpkg → files on disk
             metadata
```

In CI the same principle applies: `RUN apt-get update && apt-get install -y curl` in a Dockerfile.

## apt — everyday commands

```bash
sudo apt update
apt search nginx
apt show nginx
sudo apt install -y tree jq
sudo apt remove tree
sudo apt purge nginx-common    # package + configs (careful)
sudo apt autoremove -y
sudo apt upgrade -y
```

| Command | When to use |
|---------|-------------------|
| `update` | refresh the **index** (list of versions), doesn't install packages |
| `install` | install a package and its dependencies |
| `remove` | remove binaries, configs often remain |
| `purge` | remove the package and its configs in `/etc` |
| `upgrade` | upgrade already-installed packages |
| `dist-upgrade` | may change dependencies (major upgrades) |

**Typical mistake:** `apt install` without a preceding `update` in a fresh container — "Unable to locate package".

## dpkg — when apt no longer helps

```bash
dpkg -l | grep nginx
dpkg -L nginx | head
dpkg -S /usr/sbin/nginx
```

Installing a downloaded `.deb`:

```bash
sudo dpkg -i ./package.deb
sudo apt install -f    # pull in dependencies
```

The `iU` / broken state is almost always fixed by `apt install -f`.

## Repositories

Sources: `/etc/apt/sources.list` and `/etc/apt/sources.list.d/*.list`. After adding a PPA or an internal mirror — run `apt update` again.

Checking versions:

```bash
apt policy nginx
apt list --installed | grep nginx
```

Freezing a version (careful with security):

```bash
sudo apt-mark hold nginx
sudo apt-mark unhold nginx
```

## RHEL family — cheat sheet

| Debian/Ubuntu | RHEL/Rocky |
|---------------|------------|
| `apt install pkg` | `dnf install pkg` |
| `apt update` | `dnf makecache` |
| `dpkg -l` | `rpm -qa` |
| `dpkg -S file` | `rpm -qf file` |

The idea is the same; in enterprises there's often a private mirror and approvals for updates.

## Security and operations

- Security patches — regular `upgrade` or unattended-upgrades.
- Don't mix manual tarball installs and packages in the same path without documentation.
- Before a `purge` of a production package — back up `/etc`.

## Checklist

- Why is `apt update` not the same as `upgrade`?
- How does `remove` differ from `purge`?
- How do you find out which package owns `/usr/bin/curl`?

Next lesson: [08. Lab: apt](08-lab-packages.md).
