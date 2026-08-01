# 31. strace and lsof

## Intro: the logs are empty, but the process "won't start"

An application exits with code 1, and the journal has a single "Failed" line. **strace** shows the kernel **system calls**: which file didn't open (`ENOENT`), where `connect` didn't get through (`ECONNREFUSED`), which config it looked for first.

**lsof** (list open files) answers: **who's holding** port 80, who won't release a file during `umount: target is busy`, which PID is preventing you from deleting a log.

This isn't a replacement for proper logging — it's the **last layer**, when [ss/curl](11-network-debug.md) have already given you a symptom, but the cause is in a syscall.

## What you'll learn

- When strace is appropriate (briefly, staging/lab).
- The `-e trace=` filters and output to a file.
- **lsof** for ports, files, and directories.
- The chain: ss → curl → strace → lsof.
- The risks on production (slowdown, log volume).

---

## strace — what it is

Every library call (`open`, `read`, `connect`) eventually becomes a **syscall**. strace intercepts them and prints the arguments and the **errno**.

```bash
strace -e trace=openat,connect,read,write \
  curl -s -o /dev/null http://172.28.0.11/ 2>&1 | tail -40
```

**A successful connect:**

```text
connect(3, {sa_family=AF_INET, sin_port=htons(80), sin_addr=inet_addr("172.28.0.11")}, 16) = 0
```

**A denial:**

```text
connect(...) = -1 ECONNREFUSED (Connection refused)
```

| errno | Usual meaning |
|-------|----------------|
| ENOENT | no file/directory |
| EACCES | no permissions |
| ECONNREFUSED | the port isn't listening |
| ETIMEDOUT | firewall, no route |

### Useful flags

| Flag | Meaning |
|------|--------|
| `-f` | follow forks (child processes) |
| `-e trace=file` | only open/openat |
| `-e trace=network` | connect, accept, send, recv |
| `-p PID` | attach to a live process |
| `-o /tmp/trace.log` | write to a file |
| `-c` | statistics by syscall (a quick overview) |

```bash
strace -c sleep 1
strace -p $(pgrep -n nginx) -e trace=openat 2>&1 | head -20   # careful on prod
```

**Prod:** strace **slows down** the process; keep sessions short, use the `-e` filter, and coordinate. On high-QPS, don't leave `-p` attached for long.

---

## lsof — open files and sockets

```bash
sudo lsof -i :80
sudo lsof -iTCP -sTCP:LISTEN
sudo lsof -p $(pgrep -n sshd | head -1) | head -20
sudo lsof /var/log/nginx/access.log
sudo lsof +D /mnt/nfs-share
```

| Situation | Command |
|----------|---------|
| Who's listening on 443? | `lsof -i :443` |
| Who's holding the directory? | `lsof +D /path` |
| The file is deleted, but the space wasn't freed | `lsof` will show the process with the deleted inode |

`umount: target is busy` → `cd /`, `lsof +D /mnt/...`, stop the service or close the fd.

**Without sudo**, lsof can't see other users' processes — for the full picture you need root.

---

## Diagnostic scenario (runbook)

Problem: **curl http://172.28.0.11/ fails**

| Step | Tool | Question |
|-----|------------|--------|
| 1 | `ping`, `ip route get` | L3 OK? |
| 2 | `ss -tlnp` on srv1 | is :80 listening? |
| 3 | `curl -v` | refused vs timeout? |
| 4 | `strace -e connect curl ...` | does the syscall confirm it? |
| 5 | `lsof -i :80` | is the port taken by another process? |

---

## strace vs application logs

| | app logs | strace |
|---|----------|--------|
| Sees business logic | yes | no |
| Sees a missing /etc/app.yml | only if the app logs it | yes, openat ENOENT |
| Overhead | low | high |
| Secrets in the output | possible | possible (env, paths) |

Don't send a full trace from prod into a public ticket.

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| strace without `-e` on a busy host | a gigabyte in seconds |
| lsof without sudo | "the port is free", but it's taken |
| ignoring EACCES | thinking "the file's missing", but it's permissions/AppArmor |
| strace on sshd under load | lag for everyone on SSH |

---

## In production

**eBPF** (bpftrace, bcc), APM, distributed tracing. strace is a **last resort** on a node/pod during a "silent" exit. lsof — before umount, on "address already in use".

---

## Summary

**strace** — syscalls and errno. **lsof** — open files and sockets. Together they cover failures with no logs. Always filter and limit the time.

## Checklist

- [ ] How do you see a failed connect in strace?
- [ ] How does ENOENT differ from EACCES?
- [ ] How do you find the PID on :443?
- [ ] What do you do on umount busy?

Next lesson: [32. Lab: strace](32-lab-strace.md).
