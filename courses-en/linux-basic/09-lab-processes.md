# 09. Lab: processes and signals

## Environment

`docker compose exec lab bash`

---

## Task 1. Tree and PID 1

```bash
ps -p 1 -o pid,cmd
ps -ef --forest | head -25
```

---

## Task 2. Background and jobs

```bash
sleep 300 &
jobs -l
kill %1
jobs
```

**What you'll see:** the job disappears after kill.

---

## Task 3. SIGTERM vs SIGKILL

```bash
sleep 600 &
SPID=$!
kill $SPID
sleep 1
ps -p $SPID

sleep 600 &
SPID=$!
kill -9 $SPID
ps -p $SPID
```

The second process should not appear in `ps`.

---

## Task 4. nice

```bash
nice -n 15 sleep 120 &
ps -o pid,ni,cmd -p $!
```

**What you'll see:** NI = 15.

---

## Task 5. top snapshot

```bash
top -b -n 1 | head -12
```

Write down the load average from the first line.

---

## Success criteria

- [ ] PID 1 was shown
- [ ] The background sleep was killed via kill
- [ ] nice 15 is visible in the NI column

Next lesson: [10. systemd](10-systemd.md).
