# 21. Final project: someone else can run the repo

## Story

Nimbus wants the ops repo to survive **you**. A teammate with SSH to the three nodes and the Kubespray venv should understand the README and run the tagged plays without Slack.

No new features. Wire what you already wrote.

## Stand

[ENVIRONMENT.md](ENVIRONMENT.md). Folder `~/nimbus-ops`. Cluster already up from lesson 04.

## Requirements

| # | Criterion |
|---|-----------|
| 1 | `site.yml` applies `common`, `users`, `node-hygiene` with tags `baseline`, `users`, `hygiene` |
| 2 | `playbooks/preflight.yml` + `playbooks/patch-workers.yml` (`serial: 1`) |
| 3 | `playbooks/backup-cluster.yml` writes a new stamp under `backups/` and `etcdutl`/`etcdctl` status works |
| 4 | `playbooks/node-labels.yml` + `host_vars` for `app` / `batch` |
| 5 | `playbooks/runbooks/{disk-gc,gather,cp-health}.yml` |
| 6 | `playbooks/audit.yml` green; `artifacts/certs.txt` from the certs play |
| 7 | README: two-tree rule, kubeconfig path, Kubespray venv commands, replace order, `.gitignore` for `backups/` `artifacts/` `*.retry` |
| 8 | `.gitignore` actually ignores those paths (picture: [`examples/gitignore`](examples/gitignore)) |

Optional: `ansible-playbook site.yml --list-tags` printed in the README.

## Verification

```bash
cd ~/nimbus-ops
export KUBECONFIG=$HOME/.kube/nimbus-ops.conf
ansible all -m ping
ansible-playbook site.yml
ansible-playbook playbooks/audit.yml
bash scripts/verify.sh
```

Copy [`examples/scripts/verify.sh`](examples/scripts/verify.sh) into `~/nimbus-ops/scripts/verify.sh` and adjust paths if you used different names. The script is a **checklist**, not a secret exam harness.

### Rubric

- [ ] Teammate can `ansible-playbook site.yml --list-tags` and map tags to tickets
- [ ] You can say what Kubespray owns vs `nimbus-ops` without opening this course
- [ ] You did **not** put PKI or `admin.conf` in git
- [ ] Three nodes Ready at the end

## Demo script (5 min)

1. `ansible-inventory --graph`
2. `kubectl get nodes --show-labels`
3. `ls backups/` and one `etcdutl snapshot status` (or the playbook recap)
4. `ansible-playbook playbooks/audit.yml`
5. One sentence: OS patch ≠ `upgrade-cluster.yml`

## After this course

- [`kuber-cka`](../kuber-cka/README.md) — CKA / ON-CALL on the same class of stand
- [`gitlab-cicd`](../gitlab-cicd/README.md) — `ansible-lint` + `--syntax-check` + `--check` on `nimbus-ops`
- [`kuber-advanced`](../kuber-advanced/README.md) — platform add-ons (Helm/Argo) **after** this ops baseline
