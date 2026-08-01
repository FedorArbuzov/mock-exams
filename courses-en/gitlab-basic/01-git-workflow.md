# 01. Git: branches, MRs, commits

## Intro: a real-world scenario

Friday, 17:45. A developer pushes a "quick fix" straight into `main` — no MR, no review. On Monday the pipeline on `main` is red and prod is down for two hours. Postmortem: "Who merged last?" — and in the history there's a `fix` commit with no body. The team lead introduces a rule: **all changes through a Merge Request**, **Conventional Commits**, protected `main`. You open GitLab and see: the pipeline on MR #47 is green, and on `main` after the merge — green too. A colleague's question: "Why bother with a branch if I'm the only one on the project?" — the answer is in the **history**, the **review**, and the **CI triggers**.

In this course, Git is not an abstraction but a **source of events** for GitLab CI: a push to a feature branch, opening an MR, a merge into `main`. Without discipline around branches and commits, pipelines and DORA metrics ([`devops-culture`](../devops-culture/03-dora-metrics.md)) are meaningless.

## What you'll learn

- Why Git matters in DevOps: code, IaC, `.gitlab-ci.yml` in one repository.
- The basic cycle: clone → branch → commit → push → MR.
- Branching models: Git Flow vs **trunk-based** (the course's recommendation).
- The **Merge Request** as a gate: review, pipeline, protected branch.
- **Conventional Commits** and meaningful messages.
- `.gitignore`: what must never be committed (secrets, artifacts).

---

## Why Git in DevOps

Everything that describes infrastructure and delivery lives in Git:

| Artifact | Example path |
|----------|-------------|
| Application | `app/`, `src/` |
| CI/CD | `.gitlab-ci.yml` |
| IaC | `terraform/`, `helm/` |
| Documentation | `README.md`, `docs/` |

GitLab CI reads `.gitlab-ci.yml` **from the commit** the pipeline was created for. Change the YAML in a branch and the MR pipeline uses the **new** version of the file. This is **GitOps thinking** in miniature: the source of truth is the repository, not manual clicks in the UI.

Connection to **Lead Time for Changes** (DORA): the time from commit to prod shrinks when branches are short, MRs are small, and the pipeline is fast.

---

## Basic commands

A typical workday — a feature for the issue "add lint to CI":

```bash
git clone http://localhost:8929/root/hello-ci.git
cd hello-ci
git checkout -b feature/add-ci

# edits: .gitlab-ci.yml, app/, tests/
git status
git add .gitlab-ci.yml app/ tests/
git commit -m "feat(ci): add lint and unit test jobs"
git push -u origin feature/add-ci
```

After the push in GitLab: **Create merge request** → target `main`.

| Command | Purpose |
|---------|------------|
| `git status` | what changed, what's staged |
| `git diff` | diff of unstaged changes |
| `git log --oneline -10` | the latest commits |
| `git pull --rebase origin main` | pull `main` before pushing (a good habit) |

**Rebase vs merge:** for a learning course, merging through the GitLab UI is enough. In teams, `rebase` onto `main` before merge is common — a linear history.

---

## Branches: models and practice

| Branch | Purpose |
|-------|------------|
| `main` / `master` | production-ready, protected |
| `develop` | integration (optional, Git Flow) |
| `feature/*` | one task — one branch |
| `fix/*`, `hotfix/*` | fixes |

### Trunk-based development

Short-lived feature branches (hours–1–2 days), frequent merges into `main` behind a flag or after green CI. Long branches that "live for a month" mean conflicts, fear of merging, and a falling **Deployment Frequency**.

```text
main ──●──●──●──●──●──►
        \    /
feature   ●──●
```

For **gitlab-basic** on local `:8929`, `main` + `feature/...` is enough.

### Branch vs tag

| | Branch | Tag |
|---|--------|-----|
| Moves | yes (new commits) | no (a pointer to a commit) |
| CI on push | yes | on tag push (rules) |
| Release | usually a tag `v1.2.0` | semver on a commit |

---

## Merge Request (MR)

In GitLab, **MR** = Pull Request in GitHub. Workflow:

```text
1. Push a feature branch
2. Open an MR → main
3. Pipeline on the MR (if rules are configured)
4. Code review → Approve
5. Merge (squash or merge commit — project setting)
6. Pipeline on main (optionally post-merge)
```

**Why an MR if you could just push to main?**

- **Review** — a second pair of eyes on the code and YAML.
- **CI before merge** — don't break `main`.
- **Audit** — who approved, what was discussed.
- **Protected branches** — pushing to `main` is forbidden (chapter 02).

Connection to an issue:

```text
Issue #12 "Add CI pipeline"
    → branch issue-12-ci
    → commits
    → MR !3 with the text "Closes #12"
    → merge → issue closed automatically
```

---

## A good commit

Bad:

```text
fix
wip
asdfasdf
```

Good (**Conventional Commits**):

```text
feat(ci): add ruff lint job for Python app

- stage test, image python:3.12-slim
- rules: merge_request and main
```

Format: `<type>(<scope>): <subject>`

| type | When |
|------|-------|
| `feat` | a new feature |
| `fix` | a bug fix |
| `ci` | CI/CD only |
| `docs` | documentation |
| `chore` | routine work with no logic change |

The commit body is **what** and **why**, not a retelling of the diff. Changelogs and automation (semantic release) read the `type` and `scope`.

---

## `.gitignore`

**Never** in Git:

```gitignore
.env
.env.*
*.pem
*.key
id_rsa
__pycache__/
.venv/
dist/
*.tfstate
.terraform/
```

A "secret in Git" incident means key rotation, a permanent commit history, and a possible leak in a fork. In the course, secrets go into **CI variables** ([07-variables-secrets.md](07-variables-secrets.md)). If you accidentally committed one — don't "delete the file and forget it": you need `git filter-repo` / a support process; it's easier to **rotate** the secret.

---

## What triggers CI

It depends on `rules` / `only` in `.gitlab-ci.yml` (chapter 03). Typically:

| Event | `CI_PIPELINE_SOURCE` |
|---------|------------------------|
| Push to a branch | `push` |
| Opening/updating an MR | `merge_request_event` |
| Push a tag | `push` + tag rules |
| Schedule | `schedule` |

A push to `feature/*` **may** not run heavy jobs — only lint. A push to `main` after a merge runs the full pipeline. This saves the runner and speeds up feedback.

---

## Common mistakes

| Mistake | Consequence | Solution |
|--------|-------------|---------|
| Push straight to `main` | no review, trunk breaks | MR + protected branch |
| A huge MR (500 files) | review is impossible | break tasks up |
| A commit with a meaningless message | an unreadable `git bisect` | Conventional Commits |
| `.env` in the repository | secret leak | `.gitignore` + variables |
| Forgot `git pull` before working | conflicts at merge | rebase onto an up-to-date `main` |
| `git add .` without checking | random files in the commit | `git status`, `git diff --staged` |

---

## Summary

- Git is the source of truth for code and `.gitlab-ci.yml`; CI is tied to commits and events.
- **Feature branch → MR → merge** is the standard for safe delivery.
- **Trunk-based**: short branches, frequent merges, green CI.
- **Conventional Commits** help both the team and automation.
- Secrets and local artifacts go in `.gitignore`, not in the history.

---

## Checklist

Answer in your own words:

- [ ] How does a branch differ from a tag?
- [ ] Why an MR if you could just push to `main`?
- [ ] What usually triggers CI — push, MR, or both?
- [ ] Why Conventional Commits?
- [ ] Which three files/patterns are mandatory in `.gitignore` for Python + DevOps?
- [ ] How are short branches connected to DORA Lead Time?

Next lesson: [02-gitlab-intro.md](02-gitlab-intro.md).
