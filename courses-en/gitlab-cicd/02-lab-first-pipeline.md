# 02. Lab: first pipeline

## Goal

Green pipeline on `platform-hello`: parallel `lint` + `unit` in stage `test`.

## Tasks

1. Push [`examples/hello-ci`](examples/hello-ci/) to your GitLab project (if not done in [00](00-environment.md)).  
2. Add `.gitlab-ci.yml` with:
   - `stages: [test]`
   - jobs `lint` and `unit` (see [01](01-ci-yaml-and-runners.md))
   - `tags: [docker]` on both
   - `image: python:3.12-slim`
3. Push to a branch, open an MR into `main` (or push to `main` if you allow it for this lab).  
4. Open **CI/CD → Pipelines** — both jobs should succeed.

## Intentional failure (required once)

Break lint (e.g. unused import), push, see red job, fix, push again. Keep that MR history.

## Check

| Check | OK when |
|---|---|
| Runner | not pending |
| Graph | `lint` ∥ `unit` |
| Logs | pytest / ruff output visible |

## Next

[03 — Stages, needs, workflow, rules](03-needs-workflow-rules.md)
