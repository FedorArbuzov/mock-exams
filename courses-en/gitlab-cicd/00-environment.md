# 00. Environment

## Goal

Bring up GitLab + Kubernetes + edge LB so every later lab has the same URLs.

## Start the stand

From the **mock-exams** repository root:

```bash
mockctl up --gitlab --lb
mockctl status
```

Expect:

- `kubectl get nodes` → one Ready node (via `output/kubeconfig.yaml`)
- GitLab at http://localhost:8929
- Edge LB at http://localhost:8080 (404 until you create Ingress — that is OK)
- Runner registered with tags `docker`, `local` (or register manually — see [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md))

First GitLab boot can take **5–15 minutes**. `502` early on is normal.

## First login

1. Open http://localhost:8929  
2. User: `root`  
3. Password:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

Save it — the file is removed after 24 hours.

## Create a course project

1. **New project** → `platform-hello` (blank).  
2. Protect `main`: Settings → Repository → Protected branches.  
3. Confirm **CI/CD → Runners** shows an online runner with `docker`.

## Clone and seed the app

```bash
export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"

# copy example into a working tree you will push to GitLab
cp -r courses-en/gitlab-cicd/examples/hello-ci /tmp/platform-hello
cd /tmp/platform-hello
git init
git remote add origin http://localhost:8929/root/platform-hello.git
# commit + push (use root + password or a PAT)
```

On Windows PowerShell, use `Copy-Item -Recurse` instead of `cp -r`.

## Checklist

- [ ] `mockctl status` shows the node and GitLab URL  
- [ ] GitLab UI loads; runner online  
- [ ] Empty or seeded project `platform-hello` exists  
- [ ] `curl -s -o NUL -w "%{http_code}" http://localhost:8080/` returns something (404/503 OK)

## Stop

```bash
mockctl down          # stops minikube + GitLab containers (volumes kept)
# full GitLab wipe: docker compose -f deploy/gitlab/docker-compose.yml down -v
```

## Next

[01 — CI YAML and runners](01-ci-yaml-and-runners.md)
