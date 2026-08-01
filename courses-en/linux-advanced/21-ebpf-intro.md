# 21. eBPF and bcc-tools (intro)

## Intro: strace slows down prod, and you need an answer now

**strace** on every syscall is expensive at high QPS. **eBPF** — (verified) programs in the Linux kernel for **observability** and networking with low overhead: who opened a file, disk latency, DNS in a pod.

In K8s: **Cilium**, **Pixie**, **bpftrace** on the node — all eBPF under the hood or nearby.

## What you'll learn

- What **eBPF** is in a nutshell.
- **bcc-tools** and **bpftrace** (overview).
- When eBPF vs strace vs metrics.
- Why the packages may be absent in lab.

---

## eBPF — the idea

```mermaid
flowchart LR
  event[Kernel event]
  prog[eBPF program]
  map[maps / perf buffer]
  user[userspace tool]
  event --> prog
  prog --> map
  map --> user
```

- Load a program into the kernel with a **safety check** (bounded loops, no arbitrary memory).
- Hooks: syscalls, tracepoints, kprobes, network (XDP).
- **No** kernel recompilation for each tool.

---

## bcc / bpftrace (if installed)

```bash
sudo opensnoop-bpfcc    # who opens files
sudo biolatency-bpfcc   # disk latency histogram
sudo execsnoop-bpfcc    # new processes
```

**bpftrace** one-liner:

```bash
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_openat {
  printf("%s %s\n", comm, str(args->filename));
}'
```

In the training Docker image the packages are often **absent** — understanding the **purpose** is enough; hands-on — [lab 22](22-lab-bcc.md) with strace and PSI.

---

## When to use what

| Task | Tool |
|--------|------------|
| "Who opened /etc/shadow" | opensnoop, auditd |
| Slow disk | biolatency, iostat |
| Silent app exit | strace (briefly) |
| pod/service network | Cilium hubble, tcpdump |
| 24/7 prod | Prometheus metrics + eBPF sampling |

**strace on prod 24/7** — no. **eBPF** — short sessions or lightweight persistent agents.

---

## Link to Kubernetes

- **Cilium** — network policies + observability (eBPF dataplane).
- **kubectl debug node** — sometimes bpftrace in a privileged debug pod.
- Sidecar service mesh — a different layer, not a replacement for node-level disk latency.

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| eBPF on an old kernel | tools won't install |
| no CAP_BPF / root | permission denied |
| confusing it with DTrace on macOS | a different API |

---

## In production

Security sign-off for loading BPF. CO-RE (compile once run everywhere) in modern tools. SRE training: bpftrace for a 5-minute diagnosis.

---

## Summary

**eBPF** — in-kernel observability with less overhead than strace. **bcc/bpftrace** — lab tools. Metrics are the baseline; eBPF is for deep diagnostics.

## Checklist

- [ ] How is eBPF useful to DevOps?
- [ ] Why not strace on all of prod 24/7?
- [ ] Name one bcc-tool and its task.

Next lesson: [22. Lab: bcc](22-lab-bcc.md).
