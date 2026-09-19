# 08b. Lab: who can reach the API

## Ticket

P3 — access

Someone asks to “open 6443 to the world so CI works.” You prove what the API actually listens on. You do **not** add iptables rules on this stand.

| Layer | This stand | Prod |
|-------|------------|------|
| Perimeter | LXD NAT, 6443 not published | NLB / SG / private VPN |
| Listen | `kube-apiserver` advertise `192.168.56.10` | same idea |
| Who is allowed | `admin.conf` certs | RBAC + that perimeter |

## Task

On `node-01`:

```text
ss -lntp | grep 6443
# or: grep advertise /etc/kubernetes/manifests/kube-apiserver.yaml
```

From the **LXD host**: `kubectl get nodes` with `nimbus-ops.conf` works.

You do **not** `curl https://127.0.0.1:6443` from a random laptop on Wi‑Fi — that is the point of the NAT.

README: three layers. “I would not listen on `0.0.0.0` and allow `0.0.0.0/0`.”

## Success criteria

- [ ] you wrote the listen/advertise address
- [ ] kubectl from the host works
- [ ] you did not publish 6443 on the LXD host’s public NIC

Next: [09. Disk and journal](09-hygiene.md).
