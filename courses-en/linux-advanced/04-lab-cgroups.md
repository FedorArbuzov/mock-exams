# 04. Lab: MemoryMax in systemd

## Lab goal

Create a unit with an **intentional memory leak**, cap it with **MemoryMax=64M** and observe **OOM/kill** in the journal — the same mechanism as an OOMKilled pod in Kubernetes.

## Prerequisites

- [03. cgroups v2](03-cgroups.md).
- lab, sudo.

```bash
docker compose exec lab bash
```

---

## Preparing the stand

```bash
cat /sys/fs/cgroup/cgroup.controllers 2>/dev/null | head -1
free -h
```

---

## Task 1. A unit with a limit

**Why:** cgroup via systemd without manually echoing into sysfs.

```bash
sudo tee /etc/systemd/system/lab-memlimit.service <<'EOF'
[Unit]
Description=Memory hog demo for cgroup lab
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/bash -c 'tail -f /dev/zero'
MemoryMax=64M
Restart=no

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
```

Check the syntax:

```bash
systemd-analyze verify lab-memlimit.service 2>&1 || true
```

---

## Task 2. Start and status

```bash
sudo systemctl start lab-memlimit
sleep 3
systemctl status lab-memlimit --no-pager
```

**What you'll see:** `failed` / `killed` / `oom-kill` — not `active (running)` stably.

```bash
journalctl -u lab-memlimit -n 20 --no-pager
```

Look for: `Memory cgroup out of memory`, `Killed process`, `status=9/KILL`.

---

## Task 3. cgroup files

```bash
CG=$(systemctl show lab-memlimit -p ControlGroup --value 2>/dev/null)
echo "ControlGroup=$CG"
sudo cat /sys/fs/cgroup${CG}/memory.current 2>/dev/null
sudo cat /sys/fs/cgroup${CG}/memory.max 2>/dev/null
```

**What you'll see:** `memory.max` ≈ 64M (67108864).

---

## Task 4. Control run without a limit (optional)

```bash
sudo systemd-run --unit=lab-nolimit -- tail -f /dev/zero
sleep 2
systemctl status lab-nolimit --no-pager | head -10
sudo systemctl stop lab-nolimit
```

Without MemoryMax the process lives until it hits the host RAM — **don't leave** it for long.

---

## Task 5. Cleanup

```bash
sudo systemctl stop lab-memlimit 2>/dev/null
sudo systemctl disable lab-memlimit 2>/dev/null
sudo rm -f /etc/systemd/system/lab-memlimit.service
sudo systemctl daemon-reload
```

---

## Success criteria

- [ ] The service does not run stably above 64M
- [ ] The journal shows a sign of OOM / kill
- [ ] memory.max / memory.current in the cgroup have been inspected
- [ ] The unit was removed after the lab

## What to take to work

- OOMKilled in K8s — first look at **limits.memory** and actual consumption.
- MemoryMax in systemd — for heavy services on VMs.
- `Restart=always` + OOM = **crash loop** — alert on restart count.

Next lesson: [05. containerd](05-containerd.md).
