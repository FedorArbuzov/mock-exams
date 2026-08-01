# Interview cheatsheet — GitLab CI/CD

## One-liners

| Topic | Say this |
|---|---|
| Runner pending | No online runner matching `tags` |
| Stages vs needs | Stages = default phases; `needs` = explicit DAG / fail-fast |
| workflow:rules | Whether a pipeline is **created** |
| job rules | Whether **this job** runs / manual / never |
| Artifact vs cache | Artifact = pass outputs; cache = speed deps (best-effort) |
| SHA tag | Immutable deploy + easy rollback |
| Rollback | Redeploy `$CI_REGISTRY_IMAGE:$ROLLBACK_SHA` — do not rebuild; `rollout undo` is emergency-only |
| Environment | GitLab record of deploy + URL + stop actions |
| Review app | Ephemeral env per MR; cleanup with `on_stop` |
| include vs trigger | include merges YAML; trigger starts **child pipeline** |
| strategy: depend | Parent fails if child fails |
| resource_group | Serialize deploys (e.g. production + rollback) |
| File variable | Kubeconfig path injected; not in Git |

## Architecture soundbite (final project)

> Parent pipeline runs quality gates and triggers a **build child** (image factory) and a **deploy child** (review / staging / production). Images are tagged with `CI_COMMIT_SHA`. MRs get path-based review apps on the ingress LB; production is manual and protected. Rollback is a manual job that redeploys a previous SHA from the registry.

## Debugging order

1. Pipeline created? (`workflow`)  
2. Job pending? (runner / tags)  
3. Job failed? (log)  
4. Image missing? (registry / login)  
5. Pod ImagePullBackOff? (pull secret / tag)  
6. Wrong HTTP path? (Ingress order / rewrite)  

## See also

- Course finale: [12-final-project.md](12-final-project.md)  
- Deep dives: [`gitlab-advanced`](../gitlab-advanced/README.md)
