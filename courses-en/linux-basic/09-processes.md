# 09. Processes, signals, nice

## A process is not "a program in a list" but a living object

A running `nginx` is not a single PID forever: a master and workers, restarts, child processes. Every process has a **PID**, a parent **PPID**, a user (whose identity it runs as), open files and sockets.

```bash
ps aux
ps -ef
ps -ef --forest | head -40
```

| ps aux | Meaning |
|--------|----------|
| USER | whose UID the permissions come from |
| PID | identifier |
| %CPU / %MEM | current load |
| STAT | R run, S sleep, Z zombie, D uninterruptible I/O |
| COMMAND | argv |

In a "server is slow" incident you look at `%CPU`, `%MEM`, STAT and the tree — you don't kill blindly.

## PID 1 — the "ancestor"

```bash
ps -p 1 -o pid,cmd
```

On a server this is **systemd**. In a Docker container it's also often systemd or tini. Orphaned processes are "adopted" by PID 1 — which is why zombies sometimes pile up if the parent doesn't call `wait()`.

## Signals — polite and rude stopping

| Signal | № | When |
|--------|---|--------|
| SIGHUP | 1 | reread the config (nginx, sshd) |
| SIGINT | 2 | Ctrl+C in the terminal |
| SIGTERM | 15 | graceful termination (`kill PID`) |
| SIGKILL | 9 | kill immediately, the process can't catch it |

```bash
kill PID
kill -15 PID
kill -9 PID        # only if TERM didn't help
pkill -f "pattern"
```

**Order in prod:** `systemctl stop` → wait → if it hangs — investigate, then `-9`. SIGKILL doesn't let the application close connections and flush state.

## Backgrounding in the current shell

```bash
sleep 120 &
jobs -l
fg %1
# Ctrl+Z — suspend; bg %1 — resume in the background
```

In an SSH session, background jobs are tied to the terminal; for long tasks use `screen`, `tmux` or a systemd service.

## nice — CPU priority, not "magic"

Nice ranges from **-20** (higher priority, usually root only) to **19** (lower). A regular user can only **increase** nice (give CPU to others).

```bash
nice -n 10 stress-ng --cpu 1 --timeout 30s &
ps -o pid,ni,cmd -p $!
sudo renice -n -5 -p PID   # root can lower nice
```

Batch tasks (backup, report) are often run with `nice 10` so they don't starve the API.

## top and htop

```bash
top    # M — by memory, P — by CPU, q — quit
htop   # if installed
```

Load average (1/5/15) is the **queue** of runnable processes. High load with low CPU often means **disk waiting** (iowait) — check `iostat`, not just top.

## Zombie (STAT Z)

The process has finished, but its slot in the table remains until the parent reads the exit code. A couple of zombies is fine; hundreds — look for a bug in the parent or a script that spawns without wait.

## Checklist

- How does SIGTERM differ from SIGKILL for a database?
- How do you find the process tree of nginx?
- What will `ps -p 1` show in your lab container?

Next lesson: [09. Lab: processes](09-lab-processes.md).
