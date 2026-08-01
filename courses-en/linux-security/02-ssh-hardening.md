# 02. SSH hardening

## Why SSH is priority #1

**sshd** — a remote shell with a user's privileges. A compromised key or password = full control (especially with sudo).

Most incidents on public VPSs start with **22/tcp** and brute force.

## Configuration files

| Path | Purpose |
|------|------------|
| `/etc/ssh/sshd_config` | the main config |
| `/etc/ssh/sshd_config.d/*.conf` | drop-in (Ubuntu) — **preferred** |
| `~/.ssh/authorized_keys` | the user's keys |

After editing:

```bash
sudo sshd -t && sudo systemctl reload ssh
```

**Never** log out of your only SSH session before verifying a new one.

## Authentication

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
LoginGraceTime 30
AllowUsers course deploy
```

| Directive | Why |
|-----------|-------|
| `PermitRootLogin no` | root only locally / via sudo |
| `PasswordAuthentication no` | only after setting up keys |
| `AllowUsers` | a whitelist of logins |
| `MaxAuthTries 3` | limit brute force |

## Match — a per-user policy

```text
Match User deploy
    AllowTcpForwarding no
    X11Forwarding no
    PermitTTY no
    ForceCommand /usr/local/bin/deploy-hook.sh
```

`ForceCommand` — only one allowed command (for a CI deploy key).

## Cryptography

Modern algorithms (example):

```text
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com
```

Client check:

```bash
ssh -Q kex
ssh -Q cipher
```

## Keys

| Type | Recommendation |
|-----|--------------|
| ed25519 | the default |
| rsa 4096 | legacy systems |
| dss | **do not use** |

Permissions:

```text
~/.ssh           700
authorized_keys  600
private key      600
```

## Additional

- Port 22 → non-standard (security through obscurity is a **supplement**, not a replacement for the firewall).
- `AllowGroups sshusers`
- `Banner /etc/issue.net` — a legal warning

See [examples/sshd-hardened.snippet](examples/sshd-hardened.snippet).

## Checklist

- The order: keys → disable the password → reload?
- Why a second SSH session while editing?
- How does Match differ from the global directives?

Next lesson: [03. Lab: sshd](03-lab-ssh-harden.md).
