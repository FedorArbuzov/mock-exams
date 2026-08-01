# 11. TLS, SNI, MTU, and PMTUD

## Intro

TLS sits on top of TCP (an L7 handshake over L4). An **MTU blackhole** looks like "slow HTTPS" or a stalled upload. TLS baseline: [linux-intermediate/09–10](../linux-intermediate/09-tls-openssl.md).

---

## TLS termination

| Location | Pro | Con |
|-------|------|-------|
| Client → ALB (terminate) | centralized certificates | ALB sees plaintext to the backend unless re-encrypt |
| Pass-through (NLB TCP) | end-to-end encryption | no L7 routing on the ALB |
| Ingress / nginx | flexibility | you manage the cert lifecycle |

```bash
openssl s_client -connect host:443 -servername api.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates -subject
```

**SNI** — different certificates on one IP; without SNI, old clients break.

---

## mTLS (briefly)

The client presents a certificate. Service mesh / API gateway. Errors: wrong CA, expired client cert, **hostname mismatch** on backend verify.

---

## MTU and MSS

```text
Ethernet MTU 1500
  - IP header
  - TCP header
  = MSS ~ 1460
```

**Overlay (VXLAN +8)** + **IPsec** → a smaller effective MTU. If the path doesn't honor the **DF bit** and ICMP "Fragmentation needed" is blocked — an **PMTUD blackhole**:

- small requests are OK
- large POST/TLS records **hang**

### Fix

- Raise the MTU on the underlay (jumbo 9001 in AWS for some instances)
- Lower the MTU on the tunnel interface (`ip link set vxlan0 mtu 1450`)
- Enable TCP MSS clamping on the VPN appliance
- Don't block ICMP type 3 code 4 (frag needed)

```bash
ping -M do -s 1472 10.0.10.5    # DF, probe MTU
tracepath 10.0.10.5
```

---

## ALB / NLB timeouts

| Parameter | Symptom |
|----------|---------|
| idle timeout | long poll break |
| TLS negotiation timeout | slow clients |
| target connection timeout | backend slow start |

---

## In mock-exams

- TLS lab: [linux-intermediate/10-lab-tls](../linux-intermediate/10-lab-tls.md)
- nginx TLS: [nginx-intermediate](../nginx-intermediate/README.md)

---

## Summary

TLS is **trust and names** (SNI, chain). MTU is the **frame size along the entire path**; overlay/VPN must account for the headers.

---

## Checklist

- [ ] Where does TLS terminate in your production?
- [ ] What is an PMTUD blackhole?
- [ ] Why probe with `ping -M do`?

**Next:** [12. Kubernetes networking](12-kubernetes-networking.md).
