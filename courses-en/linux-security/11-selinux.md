# 11. SELinux and AppArmor (MAC)

## DAC vs MAC

| Model | Example | Limitation |
|--------|--------|-------------|
| **DAC** | chmod, chown | root bypasses everything |
| **MAC** | SELinux, AppArmor | kernel policy, even for root |

## SELinux (RHEL, CentOS, Fedora)

Modes:

```bash
getenforce
# Enforcing | Permissive | Disabled
```

File context:

```bash
ls -Z /etc/nginx/nginx.conf
ps -eZ | grep nginx
```

Typical issue: nginx cannot read a file — **wrong context**. Temporarily:

```bash
ausearch -m avc -ts recent
# fix: semanage fcontext + restorecon
```

Do not disable SELinux in production (`setenforce 0`) without RCA.

## AppArmor (Ubuntu)

```bash
sudo aa-status
sudo aa-complain /usr/sbin/nginx
sudo journalctl -k | grep apparmor
```

Profiles: `/etc/apparmor.d/`

| Mode | Behavior |
|-------|-----------|
| enforce | block |
| complain | log |
| disable | off |

## In the Docker lab

Full SELinux enforcing on the host; in the container — **aa-status** and understanding the concept.

## Checklist

- Why is root not all-powerful under SELinux enforcing?
- Where do you look for an AVC denial?
- How does an AppArmor profile differ from chmod?

Next lesson: [12. Audit review](12-audit-review.md).
