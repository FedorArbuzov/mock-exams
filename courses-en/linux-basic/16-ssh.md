# 16. SSH: keys, config, basics of hardening

## How you actually work with Linux in a company

Almost always: laptop → **ssh user@jump** → **ssh app@internal**. A password is rare; **keys** + sometimes MFA. Understanding `~/.ssh`, `authorized_keys` and `sshd_config` is the foundation, without which you can't deploy or fix access at night.

## Client and server

**sshd** listens on port **22** (or a non-standard one). The `ssh` client encrypts the session and negotiates authentication.

```bash
ssh course@172.28.0.11
ssh -p 2222 user@host
ssh -v course@172.28.0.11    # debug the handshake
```

## Password vs key

| Method | Where it fits |
|-------|-------------|
| Password | first-time setup, training environment |
| ed25519 key | prod, CI, everyday work |

Generate a separate key for the lab (don't mix it with your personal one):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_lab -C "course@lab"
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519_lab
cat ~/.ssh/id_ed25519_lab.pub
```

Install on the server:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519_lab.pub course@172.28.0.11
```

Manually (if there's no copy-id):

```bash
cat ~/.ssh/id_ed25519_lab.pub | ssh course@172.28.0.11 \
  'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

Verification:

```bash
ssh -i ~/.ssh/id_ed25519_lab course@172.28.0.11 hostname
```

## ~/.ssh/config — fewer typos

```text
Host srv1
    HostName 172.28.0.11
    User course
    IdentityFile ~/.ssh/id_ed25519_lab
    StrictHostKeyChecking accept-new
```

```bash
ssh srv1
scp srv1:/tmp/file .
```

## Permissions — sshd will refuse if it's "too open"

| Path | Permissions |
|------|-------|
| `~/.ssh` | 700 |
| `authorized_keys` | 600 |
| private key | 600 |
| home directory | not group/world writable |

## Hardening (careful in the lab)

In `/etc/ssh/sshd_config`, typically:

```text
PermitRootLogin no
PasswordAuthentication no    # only after verifying the key!
AllowUsers course deploy
```

```bash
sudo sshd -t && sudo systemctl reload ssh
```

**Don't disable the password** until you've confirmed the key works in a **second** session. Otherwise you'll lock yourself out.

More: [linux-security/02-ssh-hardening](../linux-security/02-ssh-hardening.md).

## scp and sftp

```bash
scp -i ~/.ssh/id_ed25519_lab local.txt course@172.28.0.11:/tmp/
sftp course@172.28.0.11
```

For large trees — [rsync](15-archives-rsync.md).

## Checklist

- Where on the **server** is the public key stored?
- Why is `chmod 644` on a private key bad?
- What do you check before `PasswordAuthentication no`?

Next lesson: [16. Lab: SSH](16-lab-ssh.md).
