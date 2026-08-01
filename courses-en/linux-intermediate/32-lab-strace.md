# 32. Lab: strace and lsof

## Lab goal

See the **system calls** hidden behind familiar commands: `curl` → `connect`, `cat` → `openat` + **ENOENT**, `sshd` → listening on a socket. This is the last diagnostic layer, when there are no application logs and `curl` has already shown refused/timeout.

## Prerequisites

- [31. strace and lsof](31-strace-lsof.md).
- The environment is up, **srv1** `172.28.0.11` is pingable from lab.
- Packages: `strace`, `lsof`.

```bash
docker compose exec lab bash
ping -c1 172.28.0.11
which strace lsof
sudo apt install -y strace lsof
```

If nginx isn't installed on srv1 — task 1 can be done on **port 22** (task 1b).

---

## Environment setup

```bash
curl -s -o /dev/null -w "srv1:80 %{http_code}\n" http://172.28.0.11/ 2>/dev/null || echo "port 80 not available — use SSH in 1b"
```

---

## Task 1. strace curl (HTTP)

**Why:** prove which IP:port the connect went to.

```bash
strace -e trace=connect,openat,read,write \
  curl -s -o /dev/null http://172.28.0.11/ 2>&1 | tail -30
```

**What you'll see (example of success):**

```text
connect(3, {sa_family=AF_INET, sin_port=htons(80), sin_addr=inet_addr("172.28.0.11")}, 16) = 0
```

| Tail of `connect(...)` | Meaning |
|----------------------|--------|
| `= 0` | TCP established |
| `= -1 ECONNREFUSED` | the port is closed / nothing is listening |
| `= -1 ETIMEDOUT` | firewall, no route |

**If you get curl: (7) Failed to connect:** start with [11-network-debug](11-network-debug.md); strace confirms the L4 layer.

---

## Task 1b. strace SSH (if :80 is unavailable)

```bash
strace -e trace=connect ssh -o ConnectTimeout=3 -o BatchMode=yes course@172.28.0.11 true 2>&1 | grep connect
```

Port **22**, not 80.

---

## Task 2. ENOENT — file not found

**Why:** distinguish "no permissions" from "no file".

```bash
strace -e trace=openat cat /nonexistent-file-xyz 2>&1 | tail -8
```

**Expected:**

```text
openat(AT_FDCWD, "/nonexistent-file-xyz", O_RDONLY) = -1 ENOENT (No such file or directory)
```

**EACCES** would be "the file exists, no permissions".

---

## Task 3. lsof — who's listening on :22

```bash
sudo lsof -i :22 | head -10
ss -tlnp | grep ':22'
```

**What you'll see:** the **sshd** process and the LISTEN state.

**Comparison:** `ss` is faster for "who's on the port"; `lsof` is handy for **files** and "who's holding a file open".

---

## Task 4. Holding a file

**Why:** before `umount` and on "device busy".

```bash
exec 9>/tmp/lab-lsof-hold
echo data >&9
sudo lsof /tmp/lab-lsof-hold
exec 9>&-
rm -f /tmp/lab-lsof-hold
```

While fd 9 is open, `lsof` shows your shell.

---

## Task 5. Writing a trace to a file

**Why:** in production you analyze it offline; don't capture a trace with secrets into a shared chat.

```bash
strace -o /tmp/trace-curl.log -e trace=network,openat \
  curl -s -o /dev/null http://172.28.0.11/ 2>/dev/null
wc -l /tmp/trace-curl.log
grep -E 'connect|openat' /tmp/trace-curl.log | head -15
rm -f /tmp/trace-curl.log
```

---

## Task 6. strace on a live PID (optional, careful)

Only in lab, for a few seconds:

```bash
PID=$(pgrep -n sshd)
sudo timeout 3 strace -p "$PID" -e trace=read,write 2>&1 | head -20
```

On prod, `-p` on sshd under load can cause slowdowns — don't do it without a reason.

---

## Success criteria

- [ ] In strace you can see `connect` to 172.28.0.11:80 or :22
- [ ] `ENOENT` is shown for a nonexistent file
- [ ] `lsof -i :22` found sshd
- [ ] You understand the difference between ENOENT and EACCES

## What to take to work

- **strace** — "why didn't it open / connect", when there are no logs.
- **lsof** — before `umount`, on "address already in use", fd leaks.
- Filter with `-e trace=`; on prod, limit the time and volume.

Next lesson: [33. Backup](33-backup-strategy.md).
