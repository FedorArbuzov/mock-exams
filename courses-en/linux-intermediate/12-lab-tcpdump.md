# 12. Lab: tcpdump and traffic analysis

## Lab goal

Capture a **short** dump of HTTP and SSH, tie the packets to **curl** and **ss** — the skill of "proving the SYN arrived" instead of guessing from a timeout. After the lab you'll read the `Flags [S]` / `[S.]` / `[P.]` lines as TCP stages.

## Prerequisites

- [11. Network diagnostics](11-network-debug.md).
- lab + srv1 (`172.28.0.11`) with ssh; nginx on :80 is desirable.

```bash
docker compose exec lab bash
sudo apt install -y tcpdump curl iproute2
ping -c1 172.28.0.11
```

---

## Preparing the stand

Write down the IPs of lab and srv1. Make sure you have **two** terminals in lab (or tmux with two panes) — tcpdump in one, curl in the other.

---

## Task 1. Baseline: ss and curl

**Why:** capture L4/L7 **before** the dump — otherwise it's unclear what to look for in the pcap.

```bash
ssh course@172.28.0.11 'ss -tlnp | grep -E ":22|:80"'
curl -s -o /dev/null -w "http=%{http_code}\n" http://172.28.0.11/ || echo "http failed — use only SSH in task 4"
```

| Result | Conclusion |
|-----------|--------|
| http=200 | the HTTP dump in task 2 makes sense |
| http failed | skip tasks 2–3, do SSH (4) |

---

## Task 2. tcpdump HTTP (two terminals)

**Terminal A (lab):**

```bash
sudo tcpdump -i any host 172.28.0.11 and port 80 -nn -c 12
```

**Terminal B (lab):**

```bash
curl -s http://172.28.0.11/ > /dev/null
```

**What you'll see in A (the order may vary slightly):**

```text
IP 172.28.0.10.xxxxx > 172.28.0.11.80: Flags [S], seq ...
IP 172.28.0.11.80 > 172.28.0.10.xxxxx: Flags [S.], seq ..., ack ...
IP 172.28.0.10.xxxxx > 172.28.0.11.80: Flags [.], ack ...
IP ... Flags [P.], ... HTTP GET / ...
```

| Flag | Stage |
|------|------|
| `[S]` | SYN — start of TCP |
| `[S.]` | SYN-ACK |
| `[.]` | ACK |
| `[P.]` | data (HTTP) |

**If empty:** nginx isn't on 80; change the filter to `port 22` or check `host` (IP typo).

---

## Task 3. curl -v — the link to the packets

```bash
curl -v http://172.28.0.11/ 2>&1 | head -35
```

Note in the output:

1. `Trying 172.28.0.11:80...`
2. `Connected to 172.28.0.11`
3. `> GET / HTTP/1.1`
4. `< HTTP/1.1 200` (or another code)

**Why:** L7 confirms what you saw as `[P.]` in tcpdump.

---

## Task 4. tcpdump SSH

**Terminal A:**

```bash
sudo tcpdump -i any host 172.28.0.11 and port 22 -nn -c 8
```

**Terminal B:**

```bash
ssh -o ConnectTimeout=5 course@172.28.0.11 'true'
```

**What you'll see:** SYN/SYN-ACK on **22/tcp**. The SSH payload is **encrypted** — "garbage" in the dump after the handshake is normal.

---

## Task 5. Writing to a file (optional)

```bash
sudo tcpdump -i any host 172.28.0.11 and port 80 -nn -c 20 -w /tmp/lab-http.pcap
curl -s http://172.28.0.11/ > /dev/null
ls -lh /tmp/lab-http.pcap
sudo tcpdump -r /tmp/lab-http.pcap -nn -c 5
sudo rm -f /tmp/lab-http.pcap
```

The file can be opened in Wireshark on your workstation. **Don't** commit a prod pcap to git.

---

## Task 6. Simulating an "empty" dump (educational)

Run tcpdump with the **wrong** port, curl on 80:

```bash
sudo tcpdump -i any host 172.28.0.11 and port 9999 -nn -c 5 &
sleep 1
curl -s -o /dev/null http://172.28.0.11/
wait
```

**Why:** to understand that an empty tcpdump is often = a **wrong filter**, not "no network".

---

## Success criteria

- [ ] tcpdump caught packets on port 80 **or** you deliberately went through SSH only
- [ ] You've explained to yourself `[S]` and `[S.]`
- [ ] curl -v is broken down by stage
- [ ] You used `-nn` and `-c`

## What to take away

- The order: **ss + curl**, then **tcpdump** with a narrow filter.
- Without `-c` on a busy host — gigabytes in seconds.
- An empty dump — check the interface, host, port.

Next lesson: [13. nginx](13-nginx.md).
