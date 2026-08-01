# 02. Lab: unshare

## Lab goal

Manually create **UTS** and **PID** namespaces via `unshare` and observe the hostname change and the process tree — without Docker, at the kernel level. After the lab the phrase "a container = namespaces" becomes concrete.

## Prerequisites

- [01. namespaces](01-namespaces.md).
- Stand: [`deploy/linux`](../../deploy/linux/README.md).

```bash
cd deploy/linux && docker compose up -d
docker compose exec lab bash
sudo apt install -y util-linux 2>/dev/null
```

---

## Preparing the stand

```bash
hostname
readlink /proc/self/ns/pid
readlink /proc/self/ns/uts
readlink /proc/self/ns/net
```

Record the hostname and the pid/uts inodes **before** the experiments.

---

## Task 1. Namespace before unshare

**Why:** a baseline for comparison.

```bash
ps -p 1 -o pid,comm
ps aux | wc -l
```

**What you'll see:** PID 1 — systemd or init in the lab container; many processes.

---

## Task 2. UTS + hostname

**Why:** isolate the hostname without a full "container".

```bash
sudo unshare --uts /bin/bash -c '
  hostname isolated-lab
  echo "inside: $(hostname)"
  readlink /proc/self/ns/uts
'
echo "outside: $(hostname)"
```

**What you'll see:** inside — `isolated-lab`, outside — the old lab hostname.

**If permission denied:** you need `sudo` (CAP_SYS_ADMIN).

---

## Task 3. PID namespace

**Why:** a new process tree, its own PID 1.

```bash
sudo unshare --fork --pid --mount-proc /bin/bash -c '
  echo "PID1: $(ps -p 1 -o comm=)"
  ps aux | head -8
  readlink /proc/self/ns/pid
'
readlink /proc/self/ns/pid
```

**What you'll see:** inside PID 1 — usually `bash`; outside the **pid** inode is different.

**If `--mount-proc` fails:** try without it — `ps` may show host processes (old kernels / container restrictions).

---

## Task 4. NET namespace (optional)

```bash
sudo unshare --net /bin/bash -c '
  ip link
  readlink /proc/self/ns/net
'
```

**What you'll see:** often only `lo` — until veth is configured, no pair with the host is created (that's what Docker/CNI does).

---

## Task 5. Comparing inodes

Fill in the table:

| Where | pid ns inode | uts hostname |
|-----|--------------|--------------|
| ordinary shell | | |
| unshare uts | | |
| unshare pid | | |

---

## Task 6. Exit

`exit` from the subshell. Verify the outside hostname did not change permanently:

```bash
hostname
```

---

## Success criteria

- [ ] hostname changed inside the UTS unshare
- [ ] In the PID unshare, PID 1 is not the host's systemd
- [ ] namespace inodes compared
- [ ] You understand: unshare ≈ what runc does

## What to take to work

- `kubectl exec` + `ps` — the picture **inside** the pod's pid ns.
- Debug on the node — different PIDs for the same containers.
- For production images — **tini/dumb-init** as PID 1.

Next lesson: [03. cgroups v2](03-cgroups.md).
