# 17. iSCSI and multipath (theory)

## Intro: "we need a disk on the server, the SAN gives a LUN"

In the cloud you click "attach volume" and get `/dev/nvme1n1`. In the data center the **storage array** serves a **LUN** over the **iSCSI** network — on Linux a `/dev/sdb` appears, and you do the **partition → mkfs → mount** yourself.

This chapter is **theory** — there's no SAN in the Docker lab. Hands-on hardware practice — [bare-metal](../bare-metal/README.md), LVM — [linux-basic/14-lvm](../linux-basic/14-lvm.md).

## What you'll learn

- **Block** (iSCSI) vs **file** (NFS) storage.
- Target, Initiator, LUN.
- The **iscsiadm** commands (concept).
- **multipath** for resilient paths.

---

## NFS vs iSCSI

| | NFS | iSCSI |
|---|-----|-------|
| Protocol | files over the network | **SCSI** over TCP |
| On the client | mount a directory | **block** `/dev/sdX` |
| Filesystem | on the **server** (export) | on the **client** (mkfs) |
| Typically | shared files, static | DB datafiles, VM disks |
| Port | 2049 | **3260** TCP |

```mermaid
flowchart LR
  target[Storage Target LUN]
  tcp[TCP 3260]
  init[Linux Initiator]
  dev[/dev/sdb]
  fs[ext4/xfs mount]
  target --> tcp --> init --> dev --> fs
```

---

## Components

| Term | Role |
|--------|------|
| **Target** | the storage array "serves" the LUN |
| **Initiator** | the consuming server (your Linux) |
| **LUN** | logical unit — a virtual disk |
| **IQN** | initiator/target name (iSCSI Qualified Name) |

---

## Linux initiator (concept)

```bash
# packages: open-iscsi
sudo systemctl enable --now iscsid
sudo iscsiadm -m discovery -t sendtargets -p 10.0.0.5
sudo iscsiadm -m node --login
lsblk
sudo mkfs.ext4 /dev/sdb1
sudo mount /dev/sdb1 /mnt/data
```

**/etc/iscsi/** — persistent login after reboot.

---

## multipath (DM-Multipath)

Two physical paths to **one** LUN (two switches, two HBAs):

```bash
sudo multipath -ll
ls -l /dev/mapper/mpatha
```

The application mounts **`/dev/mapper/...`**, not the raw `/dev/sdb` — failover when a path is lost.

| Without multipath | With multipath |
|---------------|-------------|
| path down → I/O error | switch to the second path |

---

## When to choose what

| Scenario | Common choice |
|----------|--------------|
| Shared read-many files | NFS / object storage |
| PostgreSQL data dir | local SSD / iSCSI/FC block |
| K8s RWO volume | cloud disk / CSI iSCSI |
| Legacy VM farm | iSCSI LUN |

---

## Common mistakes

| Mistake | Risk |
|--------|------|
| mkfs on a LUN with data | destruction |
| two initiators without a cluster FS | corruption |
| mounting /dev/sdb without multipath | path failover breaks the FS |
| confusing an NFS export with a LUN | wrong architecture |

---

## In production

A separate **storage VLAN**, CHAP auth, path state monitoring. For K8s — a CSI driver instead of manual iscsiadm on every node.

---

## Summary

**iSCSI** — a block disk over the network; **the FS is on the initiator**. **multipath** — one logical device, multiple paths. In lab — theory only.

## Checklist

- [ ] How does an iSCSI LUN differ from an NFS export?
- [ ] Who creates the filesystem?
- [ ] Why multipath?

Next lesson: [18. Hooks for Ansible](18-ansible-hooks.md).
