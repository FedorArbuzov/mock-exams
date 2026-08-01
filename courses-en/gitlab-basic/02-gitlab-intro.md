# 02. GitLab: project, issues, Merge Request

## Intro: a real-world scenario

Monday, onboarding. You've been granted access to the `platform` group on the corporate GitLab — but in the course you bring up **your own** instance at [http://localhost:8929](http://localhost:8929). Team lead: "Create the `hello-ci` project, open an issue for the pipeline, make an MR with `Closes #1`." You create the project with **public** visibility — a colleague reminds you: even learning code should be **Private**. Second incident: a merge into `main` without a green pipeline — turns out **protected branch** isn't set up. Third: you look for CI variables in Repository settings — but they're under **CI/CD**.

This chapter is a tour of the **GitLab UI** and settings, without which labs 04+ turn into "where's the Runners button?".

## What you'll learn

- The hierarchy: **Instance → Group → Project**.
- Creating a project and connecting it to [`hello-ci`](examples/hello-ci/).
- The **Issue → Branch → MR** cycle and auto-closing an issue.
- CI/CD settings: variables, runners, general pipelines.
- **Protected branches** and merging only on a green pipeline.
- Differences between local CE and GitLab.com (briefly).

---

## Local GitLab CE

If you haven't brought up the environment yet — [00-environment.md](00-environment.md) and [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md):

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
```

| Parameter | Course value |
|----------|----------------|
| URL | http://localhost:8929 |
| Admin | `root` |
| Compose | `deploy/gitlab/docker-compose.yml` |

At first login — the password from `initial_root_password`. For the course, a single `root` user is enough; in a team — Developer/Maintainer/Owner roles.

---

## The GitLab hierarchy

```text
Instance (your GitLab CE on :8929)
└── Group (optional: "courses", "team-platform")
      └── Project (repository + CI + Issues + Wiki)
            ├── Repository (Git)
            ├── CI/CD → Pipelines
            ├── Issues / MR
            └── Settings
```

| Level | Example | Why |
|---------|--------|-------|
| Instance | localhost:8929 | shared runners, admin |
| Group | `mock-exams-students` | shared variables, permissions |
| Project | `hello-ci` | one service / one course project |

At the basic level, it's often: **a project under root** (`root/hello-ci`) without a group — simpler for the labs.

---

## Creating the hello-ci project

1. **Projects → New project → Create blank project**.
2. **Project name:** `hello-ci`.
3. **Visibility:** **Private** (even locally — a good habit).
4. **Initialize repository with a README** — optional; in lab 04 you can `git init` locally and push.

After creation, GitLab shows a **clone URL**:

```text
http://localhost:8929/root/hello-ci.git
```

SSH (`git@...`) on local CE without configuring keys in compose may not work — the course uses **HTTP** + password/PAT.

### First push

```bash
cd /path/to/hello-ci
git init
git remote add origin http://localhost:8929/root/hello-ci.git
git add .
git commit -m "chore: initial hello-ci from course examples"
git branch -M main
git push -u origin main
```

---

## Issues: tracking work

**Issues** are tickets inside a project (like a Jira-lite).

Creating one:

1. **Issues → New issue**.
2. Title: `Add CI pipeline with lint and unit tests`.
3. Description: success criteria, a link to the course chapter.
4. Assignee: you; Label: `ci`, `good first issue` (if you created labels).

**Connection to a branch:** in an MR or commit message:

```text
Closes #1
Fixes #1
Resolves #1
```

When the MR is merged, issue **#1** closes automatically.

```text
Issue #1 "Add CI pipeline"
    → git checkout -b issue-1-ci
    → commits + .gitlab-ci.yml
    → MR !1 "Closes #1"
    → merge → issue closed
```

This gives visibility for the manager and a connection to **Lead Time** — from issue to merge.

---

## Merge Request in the UI

**Merge requests → New merge request:**

| Field | Recommendation |
|------|--------------|
| Source | `issue-1-ci` |
| Target | `main` |
| Title | like the commit: `feat(ci): add pipeline` |
| Description | what was done, how to test, `Closes #1` |
| Assignee / Reviewer | yourself or a colleague |

MR tabs:

| Tab | Content |
|---------|------------|
| Changes | diff |
| Pipelines | CI status on this MR |
| Commits | the branch's list of commits |

**Merge** only when the pipeline is green (if enabled in the protected branch).

---

## Settings: CI/CD

**Settings → CI/CD** (expand the sections):

### General pipelines

| Option | Why |
|-------|-------|
| Auto-cancel redundant pipelines | a new push cancels the old pipeline on the same branch — saves the runner |
| CI/CD configuration file | an alternative path to the YAML (rarely) |

### Variables

Secrets and config for jobs — chapter [07-variables-secrets.md](07-variables-secrets.md). Path: **Settings → CI/CD → Variables → Add variable**.

### Runners

A list of project / group / instance runners. A **green** status = online. Chapter [05-runners.md](05-runners.md).

### Pipeline triggers / Schedules

At the basic level — an overview; in intermediate — scheduled pipelines, triggers.

---

## Protected branches

**Settings → Repository → Protected branches** → protect `main`:

| Setting | Course recommendation |
|-----------|-------------------|
| Allowed to merge | Maintainers (or Developers + approval) |
| Allowed to push | **No one** (only through an MR) |
| Require approval | 1 approval (optional on CE) |
| **Require status checks** | pipeline must succeed |

Effect: a direct `git push origin main` → **rejected** for a Developer. Only an MR merge after green CI.

Connection to **Change Failure Rate** (DORA): less "broken main" → fewer hotfixes and rollbacks ([`devops-culture`](../devops-culture/03-dora-metrics.md)).

---

## Repository settings

| Section | Why |
|--------|-------|
| Default branch | usually `main` |
| Merge method | merge commit / squash / fast-forward |
| Push rules | forbid secrets in a commit (EE feature; on CE — review + gitleaks in CI later) |

**Squash merge** — one commit into `main` from the whole branch; a clean trunk history.

---

## GitLab CE vs GitLab.com

| | Local CE (`:8929`) | GitLab.com |
|---|------------------------|------------|
| Hosting | your Docker | SaaS |
| Runners | you register them yourself | shared runners (limits) |
| Registry | localhost paths | `registry.gitlab.com` |
| Course | all labs | the same YAML, a different URL |

The skills are **portable**: `.gitlab-ci.yml` is essentially the same; the URL, runners, and variables change.

---

## Common mistakes

| Mistake | Symptom | Solution |
|--------|---------|---------|
| Variables in Repository → wrong place | can't find the secrets | **CI/CD → Variables** |
| Public project | unwanted visibility | Private |
| No protected `main` | a push breaks the trunk | Protected branches |
| MR without `Closes #N` | the issue stays open | add it to the description |
| Clone over SSH without keys | Permission denied | HTTP remote |
| Looking for the pipeline in Builds | an outdated name | **CI/CD → Pipelines** |

---

## Summary

- The **project** is the hub: Git, Issues, MR, CI.
- The **Issue → branch → MR → merge** workflow gives traceability.
- **Settings → CI/CD** — variables, runners, auto-cancel.
- **Protected `main`** + a green pipeline — the minimal quality gate.
- Local CE on `:8929` mirrors the logic of a corporate GitLab.

---

## Checklist

- [ ] Group vs Project — what's the difference?
- [ ] How do you close issue #5 from an MR in one phrase?
- [ ] Where in the UI do you set a masked CI variable?
- [ ] Why protect the `main` branch?
- [ ] Where do you check a runner's status?
- [ ] What's the clone URL for the `root/hello-ci` project?

Next lesson: [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).
