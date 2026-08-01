# 05. Containers: escape, capabilities, misconfiguration

## Intro

A container is **not a VM**: it shares the host kernel. "We're in Docker" doesn't mean isolation from a neighbor or from the host. An attacker looks for **privileged**, a **docker.sock mount**, a **CVE in the runtime**, a **weak seccomp**.

---

## Threat model

| Vector | Goal |
|--------|------|
| Vulnerable image | RCE in the application |
| Misconfig | root, caps, hostPath |
| Runtime CVE | escape into the host namespace |
| Registry | image substitution |
| Supply chain | malicious base layer |

---

## Common misconfigurations

| Misconfig | Risk |
|-----------|------|
| `privileged: true` | almost host |
| `hostPID`, `hostNetwork` | bypass network policy |
| Mount `/var/run/docker.sock` | root on the host |
| `CAP_SYS_ADMIN` | many escape techniques |
| Writable root FS | malware persistence |
| `:latest` without a digest | drift and substitution |
| Secrets in ENV | visible in inspect, logs |

Related: [containers-basic/14](../containers-basic/14-security.md), [kuber-advanced/19](../kuber-advanced/19-securitycontext.md).

---

## Hardening checklist

```text
□ Non-root USER (fixed UID)
□ Read-only rootfs + tmpfs /tmp
□ Drop ALL caps, add only NET_BIND_SERVICE if needed
□ No privileged / host namespaces
□ Minimal base (distroless / alpine + scan)
□ Pin digest: image@sha256:...
□ Scan in CI: trivy image --severity HIGH,CRITICAL
```

---

## Escape (concept)

The chain is often: **app RCE** → abuse a **weak cap** or a **kernel CVE** → access the host.

| Defense layer | Example |
|-------------|--------|
| App | patch, WAF |
| Image | non-root, minimal packages |
| Runtime | gVisor, Kata (rare in training environments) |
| Host | seccomp, AppArmor, user namespaces |
| Orchestrator | PSA, admission deny privileged |

Don't rely on a single layer.

---

## Registry and trust

| Practice | Why |
|----------|--------|
| Private registry | don't pull from Docker Hub in prod |
| RBAC on push | only the CI service account |
| Image signing | cosign — [kuber-advanced/21](../kuber-advanced/21-image-security.md) |
| Admission verify signature | Kyverno |

---

## Attack on CI → image

```text
Compromised runner → docker build with a backdoor → push registry → deploy
```

Controls: isolated runners, **no docker.sock** on a shared runner, signed images, deploy signed only.

---

## In mock-exams

| Practice | Course |
|----------|------|
| USER, read-only | [containers-basic/14](../containers-basic/14-security.md), deploy/containers |
| Trivy | [gitlab-advanced/03](../gitlab-advanced/03-container-scanning.md) |
| Pod Security | [kuber-advanced/18–20](../kuber-advanced/18-pod-security.md) |

---

## Summary

Container security is **image + runtime config + registry trust**. DevOps closes misconfigs before K8s; in the cluster it's admission and PSA.

---

## Checklist

- [ ] Does your prod image run non-root?
- [ ] Are there privileged pods in the cluster? (`kubectl get pods -A -o json | jq ...`)
- [ ] Does CI block HIGH CVEs in the base image?

**Next:** [06. Kubernetes misconfig](06-kubernetes-misconfig.md).
