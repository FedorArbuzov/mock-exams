# 25. Docker socket and the docker group

## Intro: "we added them to the docker group — now they're root"

A developer asks for `docker` without sudo. You add them to the **`docker` group**. Formally this is **root on the host**: via the socket you can mount the host's `/` into a privileged container, read `/etc/shadow`, change iptables.

In Kubernetes, **mounting docker.sock into a Pod** is an antipattern with the same risk.

## What you'll learn

- How **`/var/run/docker.sock`** is structured.
- Why the **docker group** = root equivalent.
- **Rootless** Docker/Podman (overview).
- Practices for CI and dev.

---

## Docker socket

```bash
ls -l /var/run/docker.sock
# srw-rw---- root docker
groups
id
```

The CLI (`docker run`) → **HTTP API** on the unix socket → **dockerd** → containerd → runc.

Anyone who can write to the socket can:

```bash
docker run --rm -v /:/host alpine chroot /host sh
```

---

## The docker group

| Practice | Risk |
|----------|------|
| all devs in docker | account compromise = root |
| CI runner in docker | runner VM isolation is mandatory |
| only root uses docker | inconvenient, safer |

**Alternatives:**

- `sudo` with a whitelist only for specific images (rare);
- **rootless** docker/podman;
- a remote builder (BuildKit, Kaniko in K8s) without a socket on the runner.

---

## Rootless (overview)

Rootless Docker/Podman — a daemon under the user, **user namespaces**, a smaller blast radius. Not all features (ports <1024, some volumes) are available without extra configuration.

---

## Kubernetes

| Pattern | Verdict |
|---------|---------|
| `docker.sock` in a Pod | avoid |
| DinD privileged | only isolated CI |
| Kaniko / buildkitd remote | preferred |

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| docker group in LDAP for everyone | mass root |
| world-readable socket | catastrophe |
| CI on a prod host socket | full takeover |

---

## In production

Separate build nodes. Podman rootless on workstations. Audit who is in the docker group. In the capstone — a deliberate decision for deploy/CI.

---

## Summary

**docker.sock** — an API with root privileges. The **docker group** is not "convenience" but a privilege. CI/K8s — without a socket on app hosts.

## Checklist

- [ ] Why is docker.sock = root?
- [ ] Who is in the docker group on your machine?
- [ ] How does rootless help?

Next lesson: [26. Deploy user](26-deploy-user.md).
