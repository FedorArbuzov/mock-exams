# 11. Lab: Linux nodes

Prepare three LXC nodes. Do **not** install Kubernetes yet.

Work in `~/kuber-cka` on the 16 GB host (or the Vagrant host). [ENVIRONMENT.md](ENVIRONMENT.md) has the LXD profile.

## Task

Bring up:

```text
node-01   192.168.56.10
node-02   192.168.56.11
node-03   192.168.56.12
```

Each node must:

- run Ubuntu 22.04
- accept SSH as `ubuntu` with your key
- have `sudo` without a password for that user
- be reachable from the Ansible control node (`ping` / `ansible all -m ping`)

Reference commands: [`examples/lxc-setup.sh`](examples/lxc-setup.sh). Type them; do not assume the script was copied onto the host.

## Start / Check

**Start** records that this lab is the first in the catalog (no cluster required). **Check** tries SSH to the three names/IPs.

If you use different hostnames, keep the IPs above and put the names in your later inventory — Check accepts `node-01`… or those IPs via SSH.

Next: [12. Kubespray inventory](12-lab-inventory.md).
