# 29. top, vmstat, iostat

## Intro: "the server is slow" — CPU or disk?

A ticket: API latency has tripled. A colleague opens `top`, sees **20% CPU**, and writes "there are plenty of resources, scale the application". You look at **%wa (iowait) 45%** and **iostat: %util 98%** — the bottleneck is the **disk**, not the CPU. Scaling out replicas will only multiply the load on the same EBS.

This chapter teaches you to **read** OS metrics and distinguish **CPU-bound**, **I/O-bound**, and **memory pressure** — before profiling Java/Go.

## What you'll learn

- **Load average** — what it actually is.
- **CPU bound** vs **I/O bound** vs **RAM/swap**.
- **top**, **vmstat**, **iostat**, **/proc/pressure**.
- When to install the **sysstat** package, and how not to overload the disk with the monitoring itself.

---

## Load average — not "CPU utilization percentage"

```bash
uptime
#  14:32:01 up 3 days, load average: 2.10, 1.80, 1.50
```

The three numbers are the average length of the process queue in the **runnable** and **uninterruptible sleep (D)** states over 1, 5, and 15 minutes.

| CPU cores | Load ~4.0 | Interpretation |
|-----------|-----------|----------------|
| 4 | 4.0 | "on average the queue fills all cores" |
| 8 | 4.0 | there's headroom |

Load **8** on 4 CPUs is **not always** a catastrophe: short spikes or many processes in **D** (waiting on the disk) raise the load without 100% user CPU.

**Always look together:** `%wa` in top, `vmstat`, `iostat`.

```bash
nproc
uptime
```

---

## top and htop — a "here and now" snapshot

```bash
top
# keys: 1 — all CPUs, M — sort by MEM, P — sort by CPU, H — threads, q — quit
htop   # if installed
```

**CPU line (example):**

```text
%Cpu(s):  5.2 us,  2.1 sy,  0.0 ni, 72.3 id, 18.9 wa,  0.0 hi,  1.5 st
```

| Field | Meaning |
|------|--------|
| us | user (applications) |
| sy | kernel |
| id | idle |
| **wa** | **iowait** — the CPU is waiting on the disk |
| st | steal (virtualization, neighbors on the hypervisor) |

**Memory:**

```text
MiB Mem:  7936 total,  1200 free,  3100 used,  3636 buff/cache
MiB Swap:  2048 total,  2048 free
```

**Swap used constantly** — a lack of RAM or aggressive swappiness; latency grows.

**A process's STAT:**

| STAT | Meaning |
|------|----------|
| R | running |
| S | sleeping |
| **D** | uninterruptible I/O (often disk) |
| Z | zombie (the parent didn't wait) |

```bash
top -b -n 1 | head -20
ps aux --sort=-%cpu | head
ps aux --sort=-%mem | head
```

---

## vmstat — a once-a-second rhythm

```bash
sudo apt install -y sysstat
vmstat 1 5
```

Example output (abbreviated):

```text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  1      0 500000  80000 2000000    0    0   120   450 800 1200 10  5 70 15  0
```

| Column | Meaning |
|---------|--------|
| **r** | runnable in the queue |
| **b** | blocked (often I/O) |
| **si/so** | swap in/out — bad if it's steadily > 0 |
| **bi/bo** | blocks read/write |
| **wa** | iowait % |

**I/O bound pattern:** low `us`, high **`wa`**, high **`b`**.

---

## iostat — disk by device

```bash
iostat -xz 1 3
```

Key fields (xfs/ext4 on SSD/NVMe):

| Field | Meaning |
|------|--------|
| **%util** | device utilization (~100% = saturation) |
| **await** | average I/O latency (ms) |
| **r/s, w/s** | read/write operations |

**Rule:** `%util` close to 100% and `await` growing — the disk (or the cloud volume limit) is the bottleneck.

```bash
lsblk
df -h
```

---

## /proc/pressure — PSI (modern kernels)

```bash
cat /proc/pressure/cpu 2>/dev/null
cat /proc/pressure/io 2>/dev/null
cat /proc/pressure/memory 2>/dev/null
```

Shows what fraction of the time tasks were **stalled** due to a lack of CPU/IO/memory. Handy in Kubernetes for eviction and capacity planning.

---

## Putting it together: what to do after the metrics

| Picture | Likely bottleneck | Next step |
|---------|----------------------|---------------|
| high us, low wa | CPU | profile the app, more CPU |
| high wa, %util 100% | disk | iotop, slow query, bigger/faster disk |
| si/so, little free RAM | memory | more RAM, leaks, cache tuning |
| high st | hypervisor/neighbors | change instance type, noisy neighbor |

In [lab 30](30-lab-performance.md) you'll **create** these pictures with `stress-ng`.

---

## Common mistakes

| Mistake | Reality |
|--------|--------|
| high load = CPU 100% | it may be I/O (D state) |
| looking at top only | add vmstat + iostat |
| swap is active — "normal" | check latency and si/so |
| iostat once an hour on the disk | during an incident — a `1` second interval, briefly |
| killed the process with high CPU | it may have been a symptom, not the cause |

---

## In production

Prometheus **node_exporter**, Grafana dashboards: CPU, memory, disk util, disk latency, network. Alerts on **disk util** and **memory**, not just CPU. Application profiling (flame graph) comes **after** proving the bound at the OS level.

---

## Summary

Performance diagnostics: determine the **type of bound**, then pick the tool. Load is a queue, not a percentage. **wa** and **iostat** are for the disk. Swap is a RAM signal.

## Checklist

- [ ] Load 8 on 4 CPUs — is that always bad?
- [ ] Where do you see iowait in top and vmstat?
- [ ] What does %util ≈ 100% in iostat mean?
- [ ] How is D-state in top connected to the disk?

Next lesson: [30. Lab: stress](30-lab-performance.md).
