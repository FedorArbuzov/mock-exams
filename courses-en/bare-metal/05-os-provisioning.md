# 05. OS installation: PXE, Kickstart, cloud-init

## Manual installation

ISO → KVM → "Next, Next" — only for a single server. In the data center — **automation**.

## PXE boot

```text
1. The server powers on, BIOS → PXE (boot over the network)
2. DHCP hands out an IP + the address of a TFTP/HTTP server
3. A bootloader (iPXE) is downloaded
4. Kernel + initrd + installer answer file
5. The disk is partitioned, packages are installed, reboot
```

**PXE server** — separate infrastructure (Foreman, MAAS, Cobbler, or dnsmasq+tftp by hand).

## Kickstart / Preseed / Autoinstall

**Kickstart** (RHEL/CentOS/Rocky): a single answer file for Anaconda's questions.

```text
lang en_US
keyboard us
timezone UTC
autopart --type=lvm
%packages
@^minimal
docker-ce
%end
```

**Preseed** — Debian/Ubuntu. **Autoinstall** — Ubuntu 20.04+ (cloud-init style YAML).

## cloud-init

The same mechanism as in **AWS EC2** on first boot:

- hostname, users, ssh keys.
- `runcmd` — commands at startup.
- network config.

On bare metal, cloud-init often comes from the MAAS **metadata service** or from an ISO config-drive.

| Environment | Metadata source |
|---|---|
| AWS EC2 | `169.254.169.254` |
| MAAS | MAAS API |
| VMware | guestinfo |

## Immutable / image-based

Instead of an installer — writing a **prebuilt image** to disk (Clonezilla, metal imaging) or **Talos**, **Flatcar** — an OS tailored for K8s, with minimal SSH.

## DevOps role

- Maintain a **golden image** or Kickstart profile.
- Version it in Git (like Terraform).
- CI ([`gitlab-*`](../gitlab-intermediate/README.md)) — test the kickstart in a VM.

## Checklist

- PXE — what does it load over the network?
- Kickstart vs cloud-init?
- Why is EC2 "ready with SSH right away"?
- Golden image — pros and cons?

Next lesson: [06-storage-raid-lvm.md](06-storage-raid-lvm.md).
