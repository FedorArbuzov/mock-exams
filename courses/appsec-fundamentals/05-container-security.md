# 05. Контейнеры: escape, capabilities, misconfiguration

## Введение

Контейнер — **не VM**: общее ядро хоста. «Мы в Docker» не означает изоляцию от соседа и хоста. Атакующий ищет **privileged**, **docker.sock mount**, **CVE в runtime**, **слабый seccomp**.

---

## Модель угроз

| Вектор | Цель |
|--------|------|
| Vulnerable image | RCE в приложении |
| Misconfig | root, caps, hostPath |
| Runtime CVE | escape в host namespace |
| Registry | подмена образа |
| Supply chain | malicious base layer |

---

## Типовые misconfiguration

| Misconfig | Риск |
|-----------|------|
| `privileged: true` | почти host |
| `hostPID`, `hostNetwork` | обход network policy |
| Mount `/var/run/docker.sock` | root на хосте |
| `CAP_SYS_ADMIN` | много escape техник |
| Writable root FS | persistence malware |
| `:latest` без digest | drift и подмена |
| Secrets в ENV | видны в inspect, logs |

Связь: [containers-basic/14](../containers-basic/14-security.md), [kuber-advanced/19](../kuber-advanced/19-securitycontext.md).

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

## Escape (концепт)

Цепочка часто: **app RCE** → abuse **weak cap** или **kernel CVE** → access host.

| Слой защиты | Пример |
|-------------|--------|
| App | patch, WAF |
| Image | non-root, minimal packages |
| Runtime | gVisor, Kata (редко в учебных стендах) |
| Host | seccomp, AppArmor, user namespaces |
| Orchestrator | PSA, admission deny privileged |

Не полагайтесь на один слой.

---

## Registry и trust

| Практика | Зачем |
|----------|--------|
| Private registry | не тянуть с Docker Hub в prod |
| RBAC на push | только CI service account |
| Image signing | cosign — [kuber-advanced/21](../kuber-advanced/21-image-security.md) |
| Admission verify signature | Kyverno |

---

## Атака на CI → образ

```text
Compromised runner → docker build с backdoor → push registry → deploy
```

Контроли: isolated runners, **no docker.sock** на shared runner, signed images, deploy только signed.

---

## В mock-exams

| Практика | Курс |
|----------|------|
| USER, read-only | [containers-basic/14](../containers-basic/14-security.md), deploy/containers |
| Trivy | [gitlab-advanced/03](../gitlab-advanced/03-container-scanning.md) |
| Pod Security | [kuber-advanced/18–20](../kuber-advanced/18-pod-security.md) |

---

## Резюме

Контейнерная безопасность — **образ + runtime config + registry trust**. DevOps закрывает misconfig до K8s; в кластере — admission и PSA.

---

## Чек-лист

- [ ] Ваш prod образ работает non-root?
- [ ] Есть ли privileged pods в кластере? (`kubectl get pods -A -o json | jq ...`)
- [ ] CI блокирует HIGH CVE в base image?

**Дальше:** [06. Kubernetes misconfig](06-kubernetes-misconfig.md).
