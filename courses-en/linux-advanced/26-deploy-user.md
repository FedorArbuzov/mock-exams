# 26. Deploy user for CI/CD

## Intro: GitLab CI with the root key on the server

A pipeline with `ssh root@prod` and the key in a **CI variable** — a job compromise = a full takeover of prod. The pattern: a **deploy** user — SSH by key **only from the runner**, a **sudo whitelist** (nginx reload), no interactive root.

## What you'll learn

- **Least privilege** principles for deploy.
- SSH **Match User**, hardening.
- A **sudoers.d** whitelist.
- The link to GitLab and the capstone.

---

## Principle

| Not allowed | Allowed |
|--------|--------|
| root + NOPASSWD ALL | deploy + restart of a specific unit |
| password in CI | SSH key rotation |
| shared personal key | a separate deploy key per env |

---

## Creating the user (concept)

```bash
sudo useradd -m -s /bin/bash deploy
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# authorized_keys — only the CI runner's public key
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## sudo whitelist

`/etc/sudoers.d/deploy-nginx`:

```text
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/systemctl reload nginx, /usr/bin/nginx -t
```

```bash
sudo visudo -c
```

See [linux-intermediate/24-lab-sudo](../linux-intermediate/24-lab-sudo.md).

---

## sshd Match (preview)

```text
Match User deploy
    AllowTcpForwarding no
    X11Forwarding no
    PermitTTY yes
```

Restricting **from** an IP — `AllowUsers` + firewall on the runner subnet.

---

## GitLab CI (fragment)

```yaml
deploy_prod:
  stage: deploy
  script:
    - ssh deploy@172.28.0.11 'sudo nginx -t && sudo systemctl reload nginx'
  only:
    - main
```

The key in a **protected variable**, the **production** environment with manual approval.

---

## Audit

```bash
grep deploy /var/log/auth.log | tail -5
sudo grep deploy /var/log/auth.log | grep sudo | tail -5
```

---

## Common mistakes

| Mistake | Risk |
|--------|------|
| deploy in the docker group | root |
| whitelist `systemctl` without a path | bypass |
| one key for dev and prod | blast radius |

---

## In production

Separate deploy users per env (deploy_staging, deploy_prod). Ansible manages sudoers. MFA on human access, CI — automation keys only.

---

## Summary

**deploy** — a service account with **minimal** sudo. Keys only for CI/bastion. Capstone — deploy + nginx whitelist on srv1.

## Checklist

- [ ] Why not root in CI?
- [ ] Which 2 commands are in the sudo whitelist for nginx?
- [ ] Where do you look at the deploy audit?

Next lesson: [27. Integration](27-integration.md).
