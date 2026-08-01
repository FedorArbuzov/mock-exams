# PKI rotation checklist (lab / production outline)

Use it in [04-lab-cert-rotation](../04-lab-cert-rotation.md) and [13-capstone](../13-capstone.md).

## Leaf certificate (server / client)

- [ ] The **current serial** and **notAfter** are recorded (`openssl x509 -noout -serial -dates`)
- [ ] The cert's **consumer** is known (nginx, Java truststore, mTLS sidecar)
- [ ] The new cert is issued **before** expiry (rule: renew at ⅔ TTL)
- [ ] The chain is verified: `openssl verify -CAfile ca.pem leaf.pem`
- [ ] SAN/CN match the role (`allowed_domains`, `allow_subdomains`)
- [ ] The old cert is revoked or has expired naturally; no two active CNs without a reason
- [ ] Monitoring: an alert **14 / 7 / 1** days before expiry

## Intermediate CA

- [ ] Signed with a **short TTL** by the root (years), leaf — weeks/months
- [ ] Cross-sign or a **dual chain** when switching the intermediate (if there are many clients)
- [ ] The CRL/OCSP endpoint is updated (`pki/crl`, OCSP in Enterprise)
- [ ] The **migration window** is documented

## Root CA

- [ ] Root **offline** / HSM; online only to sign the intermediate
- [ ] Root rotation — a **rare** event with a change advisory
- [ ] The new root is delivered to all **trust stores** before revoking the old one

## Vault-specific

- [ ] `vault write -f pki/roles/...` changes — through Git + pipeline
- [ ] Lease revocation: `vault lease revoke` on compromise
- [ ] Audit: who called `pki/issue`, `pki/sign`
- [ ] Backup **unseal keys** / auto-unseal config **not** in the same bucket as the audit

## After an incident

- [ ] Root / orphan token revoked
- [ ] Policies reviewed (least privilege)
- [ ] Rotation of **all** static secrets accessible to the compromised identity
