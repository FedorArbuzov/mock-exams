# 04. Lab: certificate rotation

## Lab goal

Model the **leaf lifecycle**: issuance → expiry monitoring → "rotation" (a new issue) → revoke the old lease → fill out [`examples/rotation-checklist.md`](examples/rotation-checklist.md).

## Prerequisites

- [03. Rotation and renewal](03-rotation-renewal.md)
- [02-lab-pki-issue-cert](02-lab-pki-issue-cert.md) completed
- Sandbox with `init-engines.sh`

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

---

## Task 1. Two generations of the cert

Issue **cert A** with a short TTL:

```bash
vault write -format=json pki/issue/lab-server \
  common_name="rotate.lab.mock-exams.local" \
  ttl=2h > /tmp/vault-pki-lab/cert-a.json

LEASE_A=$(jq -r '.lease_id' /tmp/vault-pki-lab/cert-a.json)
SERIAL_A=$(jq -r '.data.serial_number' /tmp/vault-pki-lab/cert-a.json)
echo "LEASE_A=$LEASE_A SERIAL_A=$SERIAL_A"
```

After a minute (simulating "expiry is approaching") issue **cert B** for the same CN:

```bash
vault write -format=json pki/issue/lab-server \
  common_name="rotate.lab.mock-exams.local" \
  ttl=24h > /tmp/vault-pki-lab/cert-b.json

SERIAL_B=$(jq -r '.data.serial_number' /tmp/vault-pki-lab/cert-b.json)
```

**Criterion:** `SERIAL_A != SERIAL_B` — different certs for one CN are acceptable during overlap (in prod — control who listens with which one).

---

## Task 2. Check the validity periods

```bash
jq -r '.data.certificate' /tmp/vault-pki-lab/cert-a.json | openssl x509 -noout -dates
jq -r '.data.certificate' /tmp/vault-pki-lab/cert-b.json | openssl x509 -noout -dates
```

Record in the checklist's **Leaf** section: notBefore/notAfter of both.

---

## Task 3. Revoke cert A

```bash
vault lease revoke "$LEASE_A"
```

Check the cert list (optional):

```bash
vault list pki/certs
vault read pki/cert/$SERIAL_A
```

**What you'll see:** the cert may still be displayed; **revocation** affects the CRL. At the interview, the key point is: a **revoked** cert must not be accepted by a client that checks the CRL.

---

## Task 4. Fill out the rotation-checklist

Open [`examples/rotation-checklist.md`](examples/rotation-checklist.md) and check off the items in the **Leaf** section that you **actually** performed in the lab. In the **Vault-specific** section, add one line: who had access (`VAULT_TOKEN=course` — why that's bad in prod).

---

## Task 5. Role TTL (optional)

Shorten the role's max TTL (careful — lab only):

```bash
vault write pki/roles/lab-server \
  allowed_domains="lab.mock-exams.local" \
  allow_subdomains=true \
  max_ttl=48h

vault write pki/issue/lab-server \
  common_name="short.lab.mock-exams.local" \
  ttl=100h
```

**Expected:** an error about exceeding max_ttl. Restore `max_ttl=720h` via `init-engines.sh` or by hand as in the script.

---

## Success criteria

- [ ] Two serials for one CN, you understand the overlap window
- [ ] `lease revoke` performed for the old cert
- [ ] Checklist filled out (at least the Leaf section)
- [ ] You can explain **⅔ TTL** using cert B as an example

Next lesson: [05. Transit](05-transit-encryption.md).
