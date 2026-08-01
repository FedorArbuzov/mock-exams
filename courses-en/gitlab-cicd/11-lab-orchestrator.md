# 11. Lab: parent orchestrator

## Goal

Reshape the project into **parent + build child + deploy child**, and deploy a **review app** from an MR.

## Layout

```text
.gitlab-ci.yml                 # gates + triggers only
ci/
  .base.yml
  build.gitlab-ci.yml          # child: docker build/push
  deploy.gitlab-ci.yml         # child: review (this lab)
k8s/
  deployment.yaml
  ingress-review.yaml          # path /r/$CI_COMMIT_REF_SLUG/
```

## Tasks

1. Move build into `ci/build.gitlab-ci.yml`; parent triggers it with `strategy: depend`.
2. Create `ci/deploy.gitlab-ci.yml` with `deploy-review` + `stop-review` ([09](09-environments-review-apps.md)).
3. Parent triggers deploy **after** build; only on `merge_request_event`.
4. Open an MR → wait for child pipelines →
  `curl -s http://localhost:8080/r/$CI_COMMIT_REF_SLUG/ | head`
5. Stop the environment (UI or stop job) → namespace gone.



## Check

- [ ] UI shows **downstream** pipelines (not only one flat pipeline)  
- [ ] Review URL responds  
- [ ] `kubectl get ns` shows `review-…` while active, absent after stop  



## Next

[12 — Final project](12-final-project.md)