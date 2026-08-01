# 01. Threat model

A deep dive for K8s, CI and cloud: [appsec-fundamentals/02](../appsec-fundamentals/02-threat-modeling.md). For a Linux host

## What a threat model is

A **threat model** is a structured answer: *what we protect*, *from whom*, *how they might attack*, *what has already been done*.

Without a threat model, hardening turns into "let's close all the ports" without understanding the risk.

## Assets (what is valuable)

| Asset | Example on srv1 |
|-------|----------------|
| Data | `/var/lib/app`, the DB, backups in `/backup` |
| Secrets | SSH keys, `.env`, TLS keys |
| Access | the `course`, `deploy` accounts, sudo |
| Availability | nginx, ssh for CI |
| Reputation | not being a pivot for an attack into the network |

## Threats (STRIDE, briefly)

| Category | Example for a Linux server |
|-----------|--------------------------|
| **S**poofing | a fake SSH, phishing of keys |
| **T**ampering | editing `/etc/passwd`, replacing a binary |
| **R**epudiation | deleting auth logs |
| **I**nformation disclosure | world-readable `.env`, a memory dump |
| **D**enial of service | flood on 80/22, disk fill |
| **E**levation | setuid exploit, kernel, weak sudo |

## Trust boundaries

```text
     Internet / Office
            |
      [Firewall ufw]
            |
       srv1 (DMZ app)
            |
    [Private 172.28.0.0/24]
            |
      Postgres / internal
```

Everything to the **left** of the boundary is untrusted. Everything to the **right** requires authentication and minimal privileges.

## The attack surface of our stand

| Vector | Realization in lab |
|--------|------------------|
| SSH 22 | brute force, stolen key |
| HTTP 80/443 | nginx misconfig, CVE |
| Docker socket | if mounted — root |
| NFS | export 172.28.0.0/24 — data leak |
| The course training password | **not** for prod |

## Measures (what we'll do in the course)

1. SSH: keys, no root, AllowUsers
2. Firewall: default deny
3. auditd + fail2ban
4. Permissions on secrets, /tmp hardening
5. PKI for TLS
6. Audit report

## A 1-page document

A template for srv1:

```markdown
## Assets
- ...

## Threats (top 3)
1. ...

## Mitigations
- ...

## Residual risk
- ...
```

## Checklist

- Name the top 3 assets of srv1.
- Where is the trust boundary between lab and srv1?
- Why is the training password a separate threat?

Next lesson: [02. SSH hardening](02-ssh-hardening.md).
