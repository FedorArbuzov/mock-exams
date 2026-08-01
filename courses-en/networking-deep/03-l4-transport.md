# 03. L4: TCP, UDP, conntrack, sockets

## Intro

"The port is open" ≠ "the service is healthy." TCP can **hang in half-open**, conntrack can **overflow**, and UDP can drop packets "silently." DevOps lives on L4 more than it thinks — every `Connection timed out` is L4 or a filter beneath it.

Baseline: [linux-intermediate/01](../linux-intermediate/01-tcp-ip.md), tools: [11-network-debug](../linux-intermediate/11-network-debug.md).

---

## TCP: the states that on-call sees

```text
CLOSED → SYN_SENT → ESTABLISHED → FIN_WAIT → CLOSED
              ↓
         (no SYN-ACK) → timeout on the client
```

| Client symptom | Likely cause |
|-----------------|-------------------|
| `Connection refused` | RST: port closed / not listening |
| `Connection timed out` | SYN didn't arrive / dropped (firewall, wrong route) |
| Hang after connect | app isn't reading / middleware |
| Break mid-request | LB idle timeout, NAT session expired |

```bash
ss -tan state syn-recv
ss -tan state time-wait | wc -l
```

**TIME_WAIT** on the server after high RPS is normal; it's addressed with `reuseport`, tuning, more source IPs on the client — not blindly "restarting nginx."

---

## UDP

- No session establishment — **no** `refused` in the classic sense.
- DNS, QUIC, VoIP, statsd — UDP; "doesn't work" = timeout or an app-level error.
- The firewall **must** allow return traffic (stateful usually helps for related).

---

## conntrack (netfilter)

A stateful firewall and NAT keep a table of **(src,dst,proto,ports) → translation**.

```bash
cat /proc/sys/net/netfilter/nf_conntrack_count
cat /proc/sys/net/netfilter/nf_conntrack_max
dmesg | grep -i conntrack
```

| Problem | Effect |
|---------|--------|
| Table full | new connections dropped |
| Short NAT timeout | long-lived idle TCP breaks |
| Asymmetric routing | the reply doesn't hit the same entry |

In AWS the **Security Group** is stateful at the hypervisor level — analogous to conntrack, but you don't see the table.

---

## Sockets and bind

```bash
ss -tlnp | grep ':8080'
```

| Bind address | Who can connect |
|--------------|------------------|
| `0.0.0.0` | all interfaces |
| `127.0.0.1` | localhost only |
| `10.0.10.5` | only this IP |

**Sidecar / Service mesh** add a `127.0.0.1` redirect — `ss` on the "main" port can be misleading; also check `iptables -t nat -L`.

---

## Backlog and queues

The `listen()` backlog + `somaxconn` — on a SYN burst, clients see a timeout or slow accept.

Symptoms of L4 overload:

- `SYN flood` mitigation kicks in
- `Recv-Q` grows in `ss` on LISTEN

---

## In mock-exams

- NAT breaks conntrack with a wrong MASQUERADE: [06-nat](06-nat.md)
- K8s kube-proxy — NAT to a Pod IP: [12-kubernetes-networking](12-kubernetes-networking.md)

---

## Summary

L4 is **port reachability and the life of a session**. Refused vs timeout is the main forking indicator. conntrack ties together NAT and the stateful firewall — for "random" drops, look at the table and the path symmetry.

---

## Checklist

- [ ] Explain refused vs timeout using a closed SG as an example.
- [ ] Why look at `ss` on the server if the LB returns 502?
- [ ] What happens when conntrack overflows?

**Next:** [04. L7: HTTP, proxies, load balancing](04-l7-http-proxies.md).
