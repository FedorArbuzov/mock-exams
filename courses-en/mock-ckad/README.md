# Mock CKAD

Simulation of the **CKAD** (Certified Kubernetes Application Developer) exam. Three «runs» with ~7 tasks each, designed for 2 hours — this is exactly the format of the real CKAD.

Useful for:

- checking your readiness for CKAD;
- practicing tasks **for speed** in a live cluster rather than on paper;
- reinforcing the material of [`kuber-basic`](../kuber-basic/README.md) + [`kuber-intermediate`](../kuber-intermediate/README.md).

## Format

Each run is a separate directory with the structure:

```text
mock-ckad/<NN>/
├── README.md       # task descriptions (RU + EN)
├── prepare.sh      # creates the initial namespaces and resources
├── verify.sh       # automated checks via kubectl get/jsonpath
└── solution.md     # reference solution (open AFTER your attempt)
```

Running:

```bash
# Bring up the cluster
mockctl up

# Prepare the environment for a run
bash courses/mock-ckad/01/prepare.sh

# Start a 2-hour timer, read README.md, solve

# Verification
bash courses/mock-ckad/01/verify.sh
```

`verify.sh` prints lines like:

```text
[OK]   Q1: namespace 'dev' exists
[FAIL] Q2: deployment 'web' has 3 replicas (got 1)
...

Score: 5 / 7
```

After finishing you can look at [`solution.md`](#) for a walkthrough.

## Runs

| # | Topics | Difficulty | Duration |
|---|---|---|---|
| [01](01/README.md) | Pod, Deployment, Service, ConfigMap, Secret, Namespace | Low | 90 min |
| [02](02/README.md) | Probes, Resources, Init / Sidecar, Job, CronJob, Volumes | Medium | 120 min |
| [03](03/README.md) | Ingress, NetworkPolicy, RBAC, ServiceAccount, HPA | High | 120 min |

Completing all three runs with a result of ≥ 80% is a good indicator of readiness for the real CKAD.

## How the result is scored

- Each task is worth 1 point; partial credit does not count.
- A run is passed if you get ≥ 70% of the points (as on the real exam).
- `verify.sh` is deterministic: you can run it as many times as you like.

## How to reset the state

After a run:

```bash
kubectl delete ns dev qa prod 2>/dev/null
mockctl up   # fast, the cluster is already running
```

Or start clean:

```bash
mockctl clean
mockctl up
```

## Handy `kubectl` hotkeys for speed

```bash
alias k=kubectl
alias kn='kubectl config set-context --current --namespace'
export do='--dry-run=client -o yaml'   # k create deploy x --image=nginx $do > deploy.yaml
export now='--grace-period=0 --force'  # k delete pod p $now
```

`vim ~/.vimrc`:

```text
set number expandtab shiftwidth=2 tabstop=2
```

(on the real exam this is usually the first thing people set up).
