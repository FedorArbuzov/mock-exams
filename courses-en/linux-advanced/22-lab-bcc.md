# 22. Lab: observability — strace and /proc

## Lab goal

Check the availability of **bcc**; if it's absent — run **strace -c** and **PSI** (`/proc/pressure/*`); record the observability trade-offs in notes.

## Prerequisites

- [21. eBPF intro](21-ebpf-intro.md).
- lab, sudo.

```bash
docker compose exec lab bash
sudo apt install -y strace 2>/dev/null
```

---

## Task 1. bcc availability

```bash
apt search bpfcc 2>/dev/null | head -8
which opensnoop-bpfcc biolatency-bpfcc 2>/dev/null || echo "bcc not installed — use strace/PSI"
```

---

## Task 2. opensnoop (if available)

**Terminal A:**

```bash
sudo timeout 5 opensnoop-bpfcc 2>/dev/null | head -20
```

**Terminal B:**

```bash
ls /etc > /dev/null
cat /etc/hosts > /dev/null
```

**What you'll see:** COMM and FILE with bcc.

---

## Task 3. strace — syscall statistics

```bash
strace -c -o /tmp/strace-c.txt ls -la /etc >/dev/null
head -20 /tmp/strace-c.txt
```

**Why:** a quick profile of "where the time goes" without a full log.

---

## Task 4. Pressure Stall Information

```bash
cat /proc/pressure/cpu 2>/dev/null || echo "PSI not available in this container"
cat /proc/pressure/io 2>/dev/null || true
cat /proc/pressure/memory 2>/dev/null || true
```

On a real K8s node PSI is useful during eviction.

---

## Task 5. Trade-off notes

```bash
tee /tmp/observability-notes.txt <<'EOF'
Metrics (Prometheus): always-on, aggregates, low detail
strace: high detail, high cost, short sessions
eBPF/bcc: middle ground, needs packages/kernel
auditd: security config changes, not performance
When disk slow: iostat + biolatency, not only top CPU
EOF
cat /tmp/observability-notes.txt
```

---

## Success criteria

- [ ] strace -c executed
- [ ] PSI read or "not in container" noted
- [ ] `/tmp/observability-notes.txt` filled in
- [ ] opensnoop — if bcc was available; otherwise a deliberate skip

## What to take to work

- Choose the tool by the question: security vs perf vs syscall debug.
- [linux-intermediate: strace](../linux-intermediate/32-lab-strace.md) — a deeper dive.

Next lesson: [23. Capacity and runbooks](23-capacity-runbooks.md).
