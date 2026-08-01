# 03. cgroups v2

## Intro: "we set limits in YAML — the pod was OOMKilled"

In the manifest, `resources.limits.memory: 256Mi`. The pod is in the **OOMKilled** state. On the node this is not "Kubernetes magic" — kubelet set a **cgroup memory limit**, and the kernel killed the process when it was exceeded.

**cgroups** (control groups) are a kernel mechanism to **limit** and **account** CPU, memory, I/O, PIDs. Namespaces isolate "what is visible"; cgroups control "how much you can consume".

## What you'll learn

- **cgroup v2** — a single tree in `/sys/fs/cgroup`.
- How **systemd** places services into a cgroup.
- `MemoryMax`, `CPUQuota` in unit files.
- The link to `resources.limits` in Kubernetes.
- What happens during an **OOM** in a cgroup.

---

## cgroup v1 vs v2

| | v1 | v2 |
|---|-----|-----|
| Hierarchy | multiple trees | **single** tree |
| Path | `/sys/fs/cgroup/memory/...` | `/sys/fs/cgroup/` |
| systemd (modern) | v2 by default | |

Check:

```bash
mount | grep cgroup
ls /sys/fs/cgroup/
cat /sys/fs/cgroup/cgroup.controllers 2>/dev/null
```

---

## Tree and controllers

```bash
cat /sys/fs/cgroup/cgroup.controllers
# memory pids cpu io ...
```

A child cgroup **inherits** the parent's limits. Kubernetes creates a hierarchy like `kubepods/podXXX/containerYYY`.

Viewing a unit's memory (example):

```bash
systemctl status nginx 2>/dev/null | head -5
# cgroup path in the output or:
systemd-cgls | head -30
```

---

## systemd and cgroups

Each `systemctl start` → processes in a **slice/unit** cgroup:

```bash
systemctl show nginx -p ControlGroup --value 2>/dev/null
cat /sys/fs/cgroup/system.slice/nginx.service/memory.current 2>/dev/null
cat /sys/fs/cgroup/system.slice/nginx.service/memory.max 2>/dev/null
```

| File (v2) | Meaning |
|-----------|--------|
| `memory.current` | current usage |
| `memory.max` | limit (max) |
| `memory.events` | oom, oom_kill |

---

## Limits in a unit file

```ini
[Service]
MemoryMax=256M
CPUQuota=50%
TasksMax=100
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart myservice
systemctl show myservice -p MemoryMax,CPUQuotaPerSecUSec
```

| Parameter | Effect |
|----------|--------|
| MemoryMax | when exceeded — OOM killer in the cgroup |
| CPUQuota=50% | ~half of one CPU |
| TasksMax | process limit in the unit |

---

## OOM in a cgroup

When **MemoryMax** is exceeded, the kernel kills the process(es) in the cgroup — in the journal:

```text
Memory cgroup out of memory
Killed process ... (oom_reaper)
```

In Kubernetes: `kubectl describe pod` → **Last State: Terminated, Reason: OOMKilled**.

**Important:** a limit without a request is a scheduling risk; a limit below the real RSS causes constant restarts.

---

## Link to Kubernetes

| K8s | cgroup (simplified) |
|-----|-------------------|
| `limits.memory` | memory.max |
| `limits.cpu` | cpu.max / quota |
| `requests` | scheduling, not a hard cap |

On the node: `crictl inspect` / runtime spec → cgroup path.

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| service dies "silently" | MemoryMax too low |
| CPU throttle 100% | CPUQuota low under high load |
| looking at host RAM, not the cgroup | process in a container/cgroup |
| TasksMax | fork bomb / process leak |

---

## In production

Version the unit drop-in via Ansible. For containers — limits in the manifest + monitoring of **container_memory_working_set_bytes**. Node pressure — eviction before pod OOM.

---

## Summary

**cgroups v2** — resource limits. **systemd** — a convenient interface for bare metal. **OOMKilled** — almost always a cgroup memory limit. Inspect `/sys/fs/cgroup` and `systemctl show`.

## Checklist

- [ ] Where is cgroup v2 in the filesystem?
- [ ] How do you limit a service's memory via systemd?
- [ ] The link between K8s limits and OOMKilled?
- [ ] How does MemoryMax differ from having no limit?

Next lesson: [04. Lab: MemoryMax](04-lab-cgroups.md).
