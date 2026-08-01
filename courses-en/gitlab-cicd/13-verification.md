# 13. How we verify

The final project spans **GitLab UI** (hard to auto-grade fully) and **Kubernetes** (easy to probe). Use both layers.

---

## Layer 1 — Automated cluster checks

After the student claims “done”, run from the mock-exams root:

```bash
export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"
./courses-en/gitlab-cicd/scripts/verify-final.sh
```

Optional args:

```bash
./courses-en/gitlab-cicd/scripts/verify-final.sh --slug feature-foo
```

The script checks:

| Check | Expect |
|---|---|
| Nodes Ready | ≥1 |
| Namespaces | `app-staging`, `app-prod` exist |
| Staging deploy Ready | `hello-ci` or configurable name |
| Staging Ingress path | `/staging` prefix present |
| Prod deploy Ready | same |
| Prod Ingress path | `/prod` |
| Review (if `--slug`) | ns `review-<slug>` + path `/r/<slug>` |
| HTTP via LB | `curl` `:8080/staging/` and `/prod/` not connection-failed |

Exit code `0` = cluster side OK. **It does not** prove child pipelines or manual prod rules — that is Layer 2.

On Windows (PowerShell):

```powershell
$env:KUBECONFIG = "$(Get-Location)\output\kubeconfig.yaml"
bash courses-en/gitlab-cicd/scripts/verify-final.sh
# or run the kubectl/curl checks manually from the script header
```

---

## Layer 2 — Human / mentor rubric

Open the GitLab project and tick [12-final-project.md](12-final-project.md) Must rows **1–21**.

Focus spots interviewers care about:

1. **Downstream pipelines** visible under the parent (child build + child deploy).  
2. MR pipeline has review, **no** prod job (or prod is `never`).  
3. Production job is **manual** on `main`.  
4. Environment URLs match path scheme.  
5. Variable list shows File `KUBECONFIG`, no secrets in repo (`git grep` / UI).  
6. **`rollback-prod`** exists (manual); job log shows deploy of `$ROLLBACK_SHA` / previous image tag, not a new `docker build`.  
7. After rollback, `curl http://localhost:8080/prod/` matches the earlier release (mentor watches the demo).  

---

## Layer 3 — Student self-check (before submit)

```bash
# staging / prod through LB
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:8080/staging/
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:8080/prod/

# review (replace slug)
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:8080/r/YOUR_SLUG/

kubectl get ns | grep -E 'app-staging|app-prod|review-'
kubectl -n app-staging get deploy,svc,ingress
kubectl -n app-prod get deploy,svc,ingress
```

HTTP codes: prefer `200`. `404` on a path means Ingress/routing wrong; `502/503` often means no endpoints / probe / wrong service.

---

## Layer 4 — Interactive labs (cluster crumbs)

Where a lab leaves workloads in the cluster, optional `*.lab.json` can assert namespaces/deployments via `mockctl web` (same engine as kuber-basic). Pipeline-only labs stay **manual** (GitLab API auth is out of scope for mockctl today).

---

## What we deliberately do not auto-test

| Item | Why |
|---|---|
| `strategy: depend` | Needs GitLab API / UI |
| Masked variables | UI-only |
| `interruptible` / `resource_group` | YAML review |
| Child pipeline existence | UI / API |
| Rollback correctness | Needs two prod SHAs + demo curl (mentor) |

Those stay on the **rubric + demo**.

---

## Suggested grading split

| Part | Weight |
|---|---|
| `verify-final.sh` green (staging+prod) | 30% |
| Rubric A–D (YAML/architecture) | 50% |
| Docs + demo | 20% |
| Bonus | extra credit |

---

## Next

[Interview cheatsheet](interview-cheatsheet.md)
