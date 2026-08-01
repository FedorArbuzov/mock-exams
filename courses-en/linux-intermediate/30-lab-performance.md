# 30. Lab: stress and metrics

## Lab goal

Create a **controlled** CPU and I/O load and see it reflected in **top**, **vmstat**, and **iostat** — so that in production you don't have to guess "is it slow because of CPU or disk?".

After the lab you'll be able to say: "this looks like our incident — high wa, not user CPU".

## Prerequisites

- [29. Performance](29-performance.md).
- lab, sudo, 5–10 minutes without other heavy stress on the same VM.

```bash
docker compose exec lab bash
sudo apt update
sudo apt install -y sysstat stress-ng
```

---

## Environment setup

```bash
nproc
uptime
free -h
```

Write down in a notebook: **cores**, **load**, **free Mem**, **Swap used**.

---

## Task 1. Baseline (before load)

**Why:** something to compare "after" against.

```bash
vmstat 1 3
top -b -n 1 | head -12
```

Write down: **load**, the **wa** column in vmstat, **%Cpu id** in top.

---

## Task 2. CPU stress

**Why:** see **us** and load rise without a mandatory rise in wa.

```bash
stress-ng --cpu 2 --timeout 25s &
STRESS_PID=$!
sleep 3
top -b -n 1 | head -15
uptime
wait $STRESS_PID 2>/dev/null
```

**What you'll see:**

- `stress-ng` processes with high **%CPU**;
- **load average** rises (roughly toward the number of loaded CPUs);
- **wa** usually stays low.

```bash
grep '^%Cpu' <(top -b -n 1 | head -5)
```

**If the load doesn't rise:** too little stress time — increase `--timeout 40s`.

---

## Task 3. Comparison: vmstat under CPU load

```bash
stress-ng --cpu 2 --timeout 20s &
sleep 2
vmstat 1 5
wait
```

| Expectation | Columns |
|----------|---------|
| CPU bound | **r** > 0, high **us**, low **wa** |

---

## Task 4. I/O stress

**Why:** distinguish I/O bound from CPU bound.

```bash
stress-ng --hdd 1 --hdd-bytes 120M --timeout 18s &
sleep 2
vmstat 1 6
wait
```

**What you'll see:** a rise in **wa**, sometimes **b**; **bi/bo** jump around.

**If wa doesn't rise:** the disk is very fast (tmpfs) — still record **bi/bo**.

---

## Task 5. iostat

```bash
iostat -xz 1 3 2>/dev/null
```

During a repeated short stress (optional):

```bash
stress-ng --hdd 1 --hdd-bytes 80M --timeout 12s &
sleep 1
iostat -xz 1 4
wait
```

Look for **%util** and **await** on the device with activity.

---

## Task 6. Mini-report (in your notebook)

Fill in the table with your own numbers:

| State | load (1 min) | wa (vmstat) | top us | Conclusion |
|-----------|--------------|-------------|--------|-------|
| baseline | | | | |
| CPU stress | | | | CPU bound |
| I/O stress | | | | I/O bound |

---

## Task 7. PSI (optional)

```bash
cat /proc/pressure/cpu 2>/dev/null
cat /proc/pressure/io 2>/dev/null
```

Compare the "some" lines before and during stress.

---

## Success criteria

- [ ] Recorded the load before and after CPU stress
- [ ] In top you can see stress-ng processes with high %CPU
- [ ] During I/O stress there's a noticeable rise in wa or bi/bo in vmstat
- [ ] The "baseline vs stress" table is filled in

## What to take to work

- Before scaling out — **prove** the bound (CPU vs I/O vs RAM).
- High load + high wa → don't add CPU, look at the disk/DB.
- stress-ng — only on staging/lab, not on prod without approval.

Next lesson: [31. strace](31-strace-lsof.md).
