# 02. Server hardware

## Form factors

| Form | Height | Where |
|---|---|---|
| **1U / 2U** | 1–2 units in the rack | data center standard |
| **Blade** | in a chassis | dense clusters |
| **Tower** | freestanding | office, small data centers |

**U (unit)** — 44.45 mm of height in a 19" rack.

## CPU and memory

- **Sockets** — how many physical processors.
- **Cores / threads** — for Kubernetes, a node's `allocatable cpu` ≈ physical threads minus system reserved.
- **NUMA** — on large servers, memory is bound to a socket; wrong affinity hurts latency (important for databases and HPC).
- **ECC RAM** — bit error correction; standard in servers.

## Disks

| Type | When |
|---|---|
| **HDD** | large volumes, cold data |
| **SATA/SAS SSD** | boot, general storage |
| **NVMe U.2 / M.2** | maximum IOPS, local volumes for etcd, DB |

**Hot-swap** — replacing a disk without powering off (when supported by the backplane and RAID).

## RAID controller

Hardware RAID on a Perc/HPE Smart Array card:

- RAID1 — mirrored boot.
- RAID10 — databases.
- RAID5/6 — high capacity, but slow rebuilds.

**JBOD / HBA mode** — disks are exposed to the OS directly; RAID is handled by **mdadm** or **Ceph** — typical for cloud-native storage.

## Networking on the motherboard

- 2× **1G/10G/25G** RJ45 or SFP+.
- A separate **BMC** (management) port — see lesson 03.

## Specification (how to read)

Example: *2U, 2× Intel Xeon Silver 32C, 256GB RAM, 4×1.92TB NVMe, 2×10GbE, iDRAC9*.

DevOps doesn't have to spec hardware from scratch, but should be able to **read** a spec and understand the bottlenecks.

## Checklist

- 1U vs blade?
- NUMA — why does it matter for databases?
- JBOD vs hardware RAID?
- Why ECC?

Next lesson: [03-bmc-out-of-band.md](03-bmc-out-of-band.md).
