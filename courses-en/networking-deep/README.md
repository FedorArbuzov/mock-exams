# Networking Deep

An in-depth course on **networking for DevOps / SRE / platform engineers**: L2–L7, routing, NAT, cloud VPC, overlay, BGP, DNS/TLS, and **systematic diagnostics**. Theory in a "book" format; **two optional labs** on the [`deploy/linux`](../../deploy/linux/README.md) sandbox.

**Who it's for:** engineers who have completed [`linux-intermediate`](../linux-intermediate/README.md) and [`aws-intermediate`](../aws-intermediate/README.md) (VPC) and want to connect "ping doesn't work" with **routing, NAT, overlay, and the cloud** — without gaps between the host, Docker, Kubernetes, and AWS.

**Prerequisites (complete or know at the course level):**

| Course | Why |
|------|--------|
| [linux-intermediate/01](linux-intermediate/01-tcp-ip.md) | TCP/IP, CIDR, routes |
| [linux-intermediate/05–06](linux-intermediate/05-nat-forwarding.md) | NAT, forwarding |
| [linux-intermediate/07–08](linux-intermediate/07-firewall.md) | firewall |
| [linux-intermediate/11–12](linux-intermediate/11-network-debug.md) | ss, curl, tcpdump |
| [aws-intermediate/01](aws-intermediate/01-vpc-custom.md) | VPC, IGW, NAT, subnets |
| [aws-intermediate/03](aws-intermediate/03-alb-security-groups.md) | SG, ALB |

**Useful in parallel:** [kuber-basic](../kuber-basic/README.md), [containers-basic/06](../containers-basic/06-networking.md), [kuber-advanced/08](../kuber-advanced/08-network-internals.md), [bare-metal/07](../bare-metal/07-host-networking.md).

## How to read

- Each chapter is **35–55 minutes**; with notes and diagrams, up to **75 minutes**.
- The **"In mock-exams"** block links to labs and repository sandboxes (not required to understand networking in general).
- Lab **15** comes after chapters **05–06** and **13**; the `deploy/linux` sandbox (~4 GB RAM Docker).

**Time:** ~**18–24 hours** of theory + **2–3 hours** of labs; the [finale](16-synthesis.md) is a network runbook (**2–3 hours**).

## Curriculum

### Part I — Model and layers (01–04)

| № | Chapter |
|---|--------|
| 01 | [Why networking-deep: an L2–L7 map and typical failures](01-intro.md) |
| 02 | [L2–L3: ARP, VLAN, CIDR, and address design](02-l2-l3.md) |
| 03 | [L4: TCP, UDP, conntrack, sockets](03-l4-transport.md) |
| 04 | [L7: HTTP, proxies, load balancing, keep-alive](04-l7-http-proxies.md) |

### Part II — Routing, NAT, cloud (05–07)

| № | Chapter |
|---|--------|
| 05 | [Routing: tables, policy routing, asymmetry](05-routing.md) |
| 06 | [NAT: SNAT/DNAT, hairpin, mapping to AWS IGW/NAT](06-nat.md) |
| 07 | [AWS VPC: SG vs NACL, peering, endpoints, TGW](07-vpc-aws.md) |

### Part III — Overlay and WAN (08–09)

| № | Chapter |
|---|--------|
| 08 | [Overlay: VXLAN, Geneve, Docker bridge, CNI](08-overlay.md) |
| 09 | [BGP for operators: AS, path, peering](09-bgp.md) |

### Part IV — Production and diagnostics (10–16)

| № | Chapter |
|---|--------|
| 10 | [DNS in production: split-horizon, TTL, failures](10-dns-production.md) |
| 11 | [TLS, SNI, MTU, and PMTUD](11-tls-mtu.md) |
| 12 | [Kubernetes: Service, CNI, kube-proxy, Ingress](12-kubernetes-networking.md) |
| 13 | [Troubleshooting methodology and runbook](13-troubleshooting.md) |
| 14 | [Security zones, zero trust, DDoS at the edge](14-security-zones.md) |
| 15 | [Lab: path diagnostics on deploy/linux](15-lab-troubleshooting.md) |
| 16 | [Synthesis: runbook, interviews, checklist](16-synthesis.md) |

## What you should end up with

- You design **CIDR** and understand where the subnet ends and the router begins.
- You explain the difference between **SG vs NACL**, **IGW vs NAT**, **public vs private** subnets without confusion.
- You read **overlay** (VXLAN) and connect it to Docker/Kubernetes/Cilium.
- You explain **BGP** at the level of "why AS and a default route in a DC."
- You run diagnostics **bottom-up** (L3 → L4 → L7 → wire) and distinguish timeout from refused.
- You produce a **one-page network runbook** for a service.

## Sandbox

| Lab | Requirements |
|------|------------|
| [15-lab-troubleshooting](15-lab-troubleshooting.md) | [`deploy/linux`](../../deploy/linux/README.md): `docker compose up -d` |

The Kubernetes part (chapter 12) is optional via `mockctl up`; without a cluster the chapter reads as theory.

## Further reading (outside the course)

- Russ White et al. — *Computer Networking Problems and Solutions*
- AWS — *VPC User Guide*, *Advanced Networking*
- Ivan Pepelnjak — blog posts on overlay/BGP (ipspace.net)
- *TCP/IP Illustrated*, Volume 1 — for a deeper dive into L4
