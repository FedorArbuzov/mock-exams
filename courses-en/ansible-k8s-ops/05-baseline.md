# 05. Baseline next to Kubespray

Kubespray already disabled swap, loaded `br_netfilter`, installed containerd, and pinned `kubeadm` / `kubelet` / `kubectl`. If your `common` role does that again, you will fight the install on every run.

`common` is **company** state: who can log in, whether time is sane, whether sshd still allows passwords.

## What belongs in `common`

| Do | Do not |
|----|--------|
| packages: `jq`, `htop`, `chrony` | `swapoff`, k8s sysctl, containerd config |
| `sshd`: `PasswordAuthentication no`, `PermitRootLogin no` | restart `kubelet` “to be safe” |
| enable chrony, disable `systemd-timesyncd` if it fights chrony | change kubelet extra args |
| a later-lesson user `nimbus` **or** leave users to [07](07-users.md) | `apt full-upgrade` of kube packages |

A second playbook run must be `changed=0` on apt (already installed), sshd (already the lines), chrony (already enabled).

`--check --diff` against a live cluster is how you find the task that rewrites `/etc/containerd/config.toml` every time.

## Time

etcd and Kubernetes certificates assume clocks agree. LXC images often run `systemd-timesyncd`. Pick **one** NTP client. This course: **chrony** on all three, then [lesson 19](19-monday.md) asserts offset.

## sshd

`ubuntu` with a key is how you got in. After you harden sshd, keep that key. Do not set `PermitRootLogin no` and then also drop the `ubuntu` authorized key in the same play. Access playbooks come next; baseline only closes **password** and **root** logins.

## Checklist

- [ ] You can name three things Kubespray already did
- [ ] You know why `common` must not notify kubelet
- [ ] You will `--check --diff` before the first real apply

Next: [06. Lab: role `common`](06-lab-baseline.md).
