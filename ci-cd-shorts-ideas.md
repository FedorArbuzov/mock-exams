# CI/CD Shorts: Complete beginner-to-platform course

Goal: turn shorts into a coherent course that takes a beginner from “why automate delivery?” to confident pipelines — Git → CI → images → deploy → GitOps/security — without cargo-cult YAML.
Recommended length per video: **45–75 seconds** (target ~65–75 when the topic needs texture).

Shared CTA (end of every short — English publishing voice-over):
`Master CI/CD faster. Theory, hands-on labs, and interview questions - link in bio.`

Brand footer on video (series standard):
`exallenge.tech` — small, persistent, phone-safe. No QR code.

Module order = study order: why CI/CD → Git/MR workflow → pipeline anatomy → runners → variables/secrets → artifacts/cache → quality gates → containers in CI → registry → environments/deploy → GitOps split → security → reliability/scale → culture/metrics → career.

**Tooling focus:** examples lean **GitLab CI** (matches this repo: `courses/gitlab-basic` → `gitlab-intermediate` → `gitlab-advanced`, plus `gitops-basic`). Concepts transfer to GitHub Actions / Jenkins — say so when it matters, don’t invent a second full dialect in every short.

Pipeline guide (when ready): `ci-cd-shorts-pipeline-prompt.md` — until then follow channel standards in `golang-shorts-pipeline-prompt.md` / `kubernetes-shorts-pipeline-prompt.md` (TopicBanner, ~70s scripts, large on-screen YAML/commands, shared Remotion).

---

## Module 0. Why CI/CD and how to think about delivery (1–12)

Format for every item in this and the following modules:
- **Hook:** a short beginner question/pain for the lesson topic.
- **Core:** a simple explanation + 1 practical anchor (command/rule/checklist).
- **CTA:** shared line above (do not invent a different CTA).

1. What is CI in 30 seconds  
   - **Hook:** "Is CI just running tests on a server?"
   - **Core:** Continuous Integration automatically builds and checks every change so broken code never silently piles up on main.
2. What is CD — continuous delivery vs deployment  
   - **Hook:** "Delivery and deployment — same thing?"
   - **Core:** Delivery keeps artifacts always releasable; deployment actually ships to an environment — often with a manual or automated gate.
3. Why “works on my machine” dies in CI  
   - **Hook:** "My laptop is green — why is the pipeline red?"
   - **Core:** CI uses a clean, repeatable environment — that gap is the point of CI.
4. Pipeline as a product  
   - **Hook:** "Isn’t the YAML just glue?"
   - **Core:** Pipelines are production systems: latency, flakiness, and access control matter as much as app code.
5. Feedback loop speed  
   - **Hook:** "Why do seniors obsess over pipeline minutes?"
   - **Core:** Slow CI kills merge cadence; optimize the critical path first.
6. Shift-left in plain words  
   - **Hook:** "What does shift-left mean?"
   - **Core:** Catch build, test, and security issues on the MR — not after production pages.
7. Trunk-based vs long-lived branches (overview)  
   - **Hook:** "Should every feature live for weeks on a branch?"
   - **Core:** Short-lived branches + frequent integration beat giant merge conflicts.
8. CI without CD (and when that’s OK)  
   - **Hook:** "We only run tests — is that still CI/CD?"
   - **Core:** CI alone is valuable; CD starts when you produce deployable artifacts and a release path.
9. CD without CI (dangerous)  
   - **Hook:** "Can we auto-deploy without tests?"
   - **Core:** Automating a broken path ships bugs faster — gates before promote.
10. Platforms: GitLab, GitHub Actions, Jenkins  
   - **Hook:** "Which CI tool should I learn?"
   - **Core:** Learn one deeply (here: GitLab); models (jobs, runners, artifacts) transfer.
11. Myth: “CI/CD means no humans”  
   - **Hook:** "Is the goal zero humans in the loop?"
   - **Core:** Automate verification; keep humans for risk decisions and design — especially early prod promotes.
12. Roadmap: junior CI/CD skills  
   - **Hook:** "What should I be able to explain in an interview?"
   - **Core:** Pipeline stages, runners, secrets, artifacts vs cache, image build/push, environments, and a basic deploy story.

---

## Module 1. Git workflow that makes CI possible (13–28)

13. Commit → push → pipeline trigger  
   - **Hook:** "When does the pipeline start?"
   - **Core:** Push/MR events wake CI; know what triggers your project.
14. Main/master as protected truth  
   - **Hook:** "Why protect the default branch?"
   - **Core:** Protected branches require MR + green pipeline — stops force-push chaos.
15. Merge Request / Pull Request as the unit of work  
   - **Hook:** "Why not push straight to main?"
   - **Core:** MR carries review, CI status, and discussion in one place.
16. Small MRs win  
   - **Hook:** "Why was my 40-file MR stuck?"
   - **Core:** Small diffs review faster and fail clearer in CI.
17. Conventional commits (light)  
   - **Hook:** "Do commit messages matter for CI?"
   - **Core:** Clear history and optional release tooling; humans still read them under pressure.
18. Branch naming that helps ops  
   - **Hook:** "feat/login vs random asdf?"
   - **Core:** Predictable names aid permissions, environments, and cleanup.
19. Draft / WIP MRs  
   - **Hook:** "How do I push without requesting review?"
   - **Core:** Draft MRs signal incomplete work; still useful for early CI signal.
20. Required checks before merge  
   - **Hook:** "Can someone merge a red pipeline?"
   - **Core:** Branch protection + required jobs — configure deliberately.
21. Merge methods: merge commit vs squash  
   - **Hook:** "Which merge button?"
   - **Core:** Squash keeps main linear; merge commits preserve branch topology — pick a team standard.
22. Rebase vs merge (practical)  
   - **Hook:** "CI passed, then rebase broke it?"
   - **Core:** Rebase rewrites history — re-run CI after conflict resolution.
23. Tags and releases  
   - **Hook:** "How do we mark version 1.2.0?"
   - **Core:** Git tags often trigger release pipelines and immutable artifacts.
24. Monorepo vs polyrepo (CI angle)  
   - **Hook:** "One pipeline for everything?"
   - **Core:** Path filters and child pipelines keep monorepos sane.
25. CODEOWNERS and review gates  
   - **Hook:** "Who must approve infra changes?"
   - **Core:** Ownership rules prevent silent YAML/security edits.
26. Don’t commit secrets — ever  
   - **Hook:** "It’s just a test API key…"
   - **Core:** Secrets in Git are forever; rotate if leaked; use CI variables/vault.
27. `.gitignore` for CI sanity  
   - **Hook:** "Why did we commit node_modules?"
   - **Core:** Ignore build junk; keep pipelines and clones fast.
28. Mini checklist: MR ready for CI  
   - **Hook:** "Before I click Create MR?"
   - **Core:** Small diff, no secrets, tests local-ish, clear description, pipeline expected to run.

---

## Module 2. Pipeline anatomy (29–48)

29. What is a pipeline?  
   - **Hook:** "Pipeline vs job vs stage?"
   - **Core:** Pipeline = one run; stages order groups; jobs are the units that execute.
30. `.gitlab-ci.yml` as the contract  
   - **Hook:** "Where does CI configuration live?"
   - **Core:** Versioned YAML in the repo — review it like production code.
31. Stages: build → test → deploy  
   - **Hook:** "Why stages at all?"
   - **Core:** Stages create a simple sequence; later stages wait on earlier success by default.
32. Jobs: script is the heart  
   - **Hook:** "What does a job actually run?"
   - **Core:** A job runs script steps on a runner — shell commands in isolation.
33. `image:` and the job environment  
   - **Hook:** "Where do my commands execute?"
   - **Core:** Many jobs run inside a container image you choose — pin versions.
34. Only / rules: when jobs run  
   - **Hook:** "Why did deploy run on a docs typo?"
   - **Core:** `rules:` (modern) control branches, changes, and MR vs main — be explicit.
35. `needs:` and DAG pipelines  
   - **Hook:** "Must test wait for unrelated lint?"
   - **Core:** `needs` lets jobs start earlier — shorten wall-clock time.
36. Parallel jobs  
   - **Hook:** "Can tests fan out?"
   - **Core:** Split suites across jobs for speed; watch runner capacity.
37. Job status: success, failed, canceled, skipped  
   - **Hook:** "Skipped means green?"
   - **Core:** Skipped is not failure — know how it affects stage gates.
38. Allow_failure carefully  
   - **Hook:** "Why is the pipeline green with a red job?"
   - **Core:** `allow_failure` is for non-blocking signals — don’t hide real gates.
39. Retry and flake awareness  
   - **Hook:** "Should every job auto-retry?"
   - **Core:** Retries mask flakes; fix flakes, retry only transient infra errors.
40. Timeout every job  
   - **Hook:** "Job hung for two hours."
   - **Core:** Explicit timeouts protect runners and feedback loops.
41. Default templates and anchors (brief)  
   - **Hook:** "YAML is duplicated everywhere."
   - **Core:** Anchors/`extends`/`include` reduce drift — keep readable.
42. `include:` remote and local templates  
   - **Hook:** "Can multiple repos share CI?"
   - **Core:** Shared templates centralize standards; version them.
43. Child / multi-project pipelines (concept)  
   - **Hook:** "One change, many repos?"
   - **Core:** Parent triggers children — useful in platforms; watch complexity.
44. Pipeline schedules  
   - **Hook:** "Nightly builds?"
   - **Core:** Schedules for reports, dependency scans, and stale env cleanup.
45. Manual jobs  
   - **Hook:** "How do we require a human for prod?"
   - **Core:** `when: manual` for promotes — still keep automated verification before.
46. Environments keyword preview  
   - **Hook:** "What is an environment in CI UI?"
   - **Core:** Named envs track deploys and URLs — deeper in later modules.
47. Reading a failed job log  
   - **Hook:** "Where do I look first in a red job?"
   - **Core:** Last error lines, then earlier setup (image pull, auth, missing tools).
48. Mini checklist: readable pipeline  
   - **Hook:** "What does a good first YAML look like?"
   - **Core:** Clear stages, pinned images, rules, timeouts, no secret echo, one obvious critical path.

---

## Module 3. Runners and executors (49–64)

49. What is a runner?  
   - **Hook:** "Who actually runs my job?"
   - **Core:** A runner is an agent that picks jobs and executes them — shared or private.
50. Shared vs project vs group runners  
   - **Hook:** "Whose runners am I using?"
   - **Core:** Scope affects capacity, isolation, and cost — know where jobs land.
51. Tags: routing jobs  
   - **Hook:** "Job stuck pending forever?"
   - **Core:** Job tags must match a runner’s tags — classic beginner trap.
52. Executor types: shell, docker, k8s  
   - **Hook:** "Docker executor vs shell?"
   - **Core:** Docker isolates with images; shell uses the host; K8s scales pods per job.
53. Docker-in-Docker vs Kaniko (preview)  
   - **Hook:** "How do we build images in CI?"
   - **Core:** Multiple patterns exist — security and privilege differ a lot.
54. Privileged runners are dangerous  
   - **Hook:** "Just enable privileged?"
   - **Core:** Privileged ≈ root on the host — restrict who can run there.
55. Runner concurrency  
   - **Hook:** "Why are jobs queued?"
   - **Core:** Limited concurrent slots — scale runners or shorten jobs.
56. Caching on the runner host  
   - **Hook:** "Where does cache live?"
   - **Core:** Cache locality depends on executor — don’t assume magic global cache.
57. Autoscale runners (concept)  
   - **Hook:** "Idle runners cost money."
   - **Core:** Autoscale up for peaks, down for idle — platform pattern.
58. Kubernetes executor basics  
   - **Hook:** "Each job a Pod?"
   - **Core:** Clean isolation and limits; needs cluster capacity and RBAC.
59. Resource limits for jobs  
   - **Hook:** "One job starved the node."
   - **Core:** CPU/memory requests/limits keep noisy neighbors in check.
60. Runner security: who can run what  
   - **Hook:** "Can any MR use our prod deploy runner?"
   - **Core:** Separate tags/runners for untrusted forks vs protected deploys.
61. Offline / unhealthy runners  
   - **Hook:** "All jobs pending — CI broken?"
   - **Core:** Check runner status and recent registration/token issues.
62. Debugging with a known-good job  
   - **Hook:** "Is it my YAML or the fleet?"
   - **Core:** Minimal `script: ["true"]` job isolates runner problems.
63. Cost awareness  
   - **Hook:** "CI bill exploded."
   - **Core:** Minutes = money; cache, DAG, and smaller images reduce spend.
64. Mini checklist: job stuck pending  
   - **Hook:** "Pending for 20 minutes — why?"
   - **Core:** Tags match → runner online → concurrency free → protected branch rules → queue not blocked.

---

## Module 4. Variables, secrets, and config (65–80)

65. CI variables overview  
   - **Hook:** "Where do API tokens live?"
   - **Core:** Project/group/instance variables — never hardcode in YAML.
66. Protected and masked variables  
   - **Hook:** "Secret showed up in the log!"
   - **Core:** Masked hides in logs; protected limits to protected branches — use both.
67. File-type variables  
   - **Hook:** "How do I pass a kubeconfig?"
   - **Core:** File variables materialize as paths — better than pasting multi-line secrets.
68. Environment-scoped variables  
   - **Hook:** "Staging and prod need different keys."
   - **Core:** Scope variables per environment name.
69. Predefined CI variables  
   - **Hook:** "How do I know the branch name in a script?"
   - **Core:** `CI_COMMIT_SHA`, `CI_COMMIT_REF_NAME`, `CI_JOB_TOKEN` — read the docs, don’t invent.
70. `CI_JOB_TOKEN` permissions  
   - **Hook:** "Job token can’t pull the package?"
   - **Core:** Token scopes are limited by design — open carefully.
71. dotenv reports  
   - **Hook:** "How do later jobs get dynamic values?"
   - **Core:** dotenv artifacts pass variables between jobs safely-ish — still no secrets in them.
72. Don’t echo secrets  
   - **Hook:** "I used set -x and leaked the token."
   - **Core:** Debug without printing env; assume logs are semi-public.
73. Rotating secrets  
   - **Hook:** "Someone left — what about CI tokens?"
   - **Core:** Rotate on personnel change and on any leak suspicion.
74. Vault / external secret managers (concept)  
   - **Hook:** "Variables UI doesn’t scale."
   - **Core:** Short-lived credentials from Vault/OIDC beat long-lived static keys.
75. OIDC to cloud (preview)  
   - **Hook:** "Do we still store AWS access keys?"
   - **Core:** OIDC federation issues temporary creds — advanced module deep-dive later.
76. Config vs secret  
   - **Hook:** "Is the DB host a secret?"
   - **Core:** Non-secret config can be plain; credentials never are.
77. Per-branch overrides  
   - **Hook:** "Feature branch needs a mock API URL."
   - **Core:** Rules + variables — avoid copying whole pipelines.
78. Settings drift between envs  
   - **Hook:** "Prod has a different variable name."
   - **Core:** Document required variables; fail fast if missing.
79. Audit who changed variables  
   - **Hook:** "Who rotated the deploy key?"
   - **Core:** Prefer platforms with audit trails; limit Maintainer access.
80. Mini checklist: secrets hygiene  
   - **Hook:** "Quick secrets review?"
   - **Core:** No secrets in Git/logs, masked+protected, least privilege, rotation plan, prefer short-lived creds.

---

## Module 5. Artifacts, cache, and speed (81–96)

81. Artifacts vs cache  
   - **Hook:** "Aren’t they the same?"
   - **Core:** Artifacts are job outputs you keep; cache is a speed hint that may vanish.
82. Passing build output to test  
   - **Hook:** "Test job can’t see the binary."
   - **Core:** Declare `artifacts:` paths from build; test downloads them.
83. Artifact expiry  
   - **Hook:** "Storage filled with old zips."
   - **Core:** Set expiry; keep release artifacts longer deliberately.
84. Reports: junit, coverage  
   - **Hook:** "How does MR show test results?"
   - **Core:** Report artifacts integrate with MR widgets — great developer UX.
85. Cache keys that work  
   - **Hook:** "Cache never hits."
   - **Core:** Key on lockfiles (`package-lock`, `go.sum`) — not on random timestamps.
86. When cache hurts  
   - **Hook:** "Cached deps caused weird failures."
   - **Core:** Corrupt/partial caches happen — provide clear cache bust paths.
87. Dependency proxy / pull-through (concept)  
   - **Hook:** "Docker Hub rate limits in CI."
   - **Core:** Proxy/cache base images to stabilize builds.
88. Sparse checkouts / fetch depth  
   - **Hook:** "Clone takes forever."
   - **Core:** Shallow clone when history isn’t needed; full history for tags/changelog tools.
89. Monorepo path filtering  
   - **Hook:** "Docs change rebuilt everything."
   - **Core:** `rules:changes` skip unaffected components.
90. Matrix builds  
   - **Hook:** "Test on Node 18 and 20?"
   - **Core:** Parallel matrix expands versions without copy-paste jobs.
91. Interruptible pipelines  
   - **Hook:** "Old pipeline wastes runners after a new push."
   - **Core:** Interruptible jobs cancel superseded runs — save minutes.
92. Resource groups  
   - **Hook:** "Two deploys to staging raced."
   - **Core:** Resource groups serialize sensitive environments.
93. Pipeline graphs for humans  
   - **Hook:** "Nobody understands our YAML."
   - **Core:** Keep stage names meaningful; document the critical path in the README.
94. Measuring CI duration  
   - **Hook:** "Is CI slower than last quarter?"
   - **Core:** Track p50/p95 duration — optimize what developers wait on.
95. Fail fast ordering  
   - **Hook:** "We run the 20-minute e2e before lint."
   - **Core:** Cheap static checks first; expensive tests later.
96. Mini checklist: faster pipeline  
   - **Hook:** "Cut 10 minutes somehow?"
   - **Core:** DAG/`needs`, cache lockfiles, smaller images, path rules, fail-fast order, interruptible.

---

## Module 6. Quality gates (97–112)

97. Lint as a gate  
   - **Hook:** "Why block merge on formatting?"
   - **Core:** Consistent code reduces review noise — cheap CI win.
98. Unit tests in CI  
   - **Hook:** "Must every PR run unit tests?"
   - **Core:** Yes for critical paths — keep them fast and deterministic.
99. Integration tests  
   - **Hook:** "Unit green, still broken together."
   - **Core:** Spin dependencies with services/compose — isolate flakes.
100. Flaky tests are production bugs  
   - **Hook:** "Just retry the job?"
   - **Core:** Quarantine and fix flakes; retries hide real instability.
101. Coverage thresholds (careful)  
   - **Hook:** "Require 90% coverage?"
   - **Core:** Coverage is a signal, not a religion — guard critical packages first.
102. Typechecks / static analysis  
   - **Hook:** "CI caught a nil panic before review."
   - **Core:** `go vet`, mypy, eslint — language-appropriate static gates.
103. Contract / API checks  
   - **Hook:** "Frontend and backend disagree."
   - **Core:** Schema/contract tests in CI prevent silent breakages.
104. Snapshot tests discipline  
   - **Hook:** "Huge snapshot diffs every PR."
   - **Core:** Review snapshots like code; don’t blind-update.
105. E2E: fewer, stable, later  
   - **Hook:** "E2E takes 40 minutes."
   - **Core:** Small critical journeys; run on main/nightly if too heavy for every MR.
106. Blocking vs informative jobs  
   - **Hook:** "Security scan is yellow — merge?"
   - **Core:** Decide which jobs are merge blockers — document it.
107. Generated code check  
   - **Hook:** "Forgot to run generate."
   - **Core:** CI fails if `git diff` dirty after generate — classic Go/protobuf pattern.
108. License / dependency review (light)  
   - **Hook:** "Can we use this package?"
   - **Core:** Basic license and known-vuln signals before deep DevSecOps module.
109. Policy as code preview  
   - **Hook:** "Who enforces Dockerfile rules?"
   - **Core:** OPA/Conftest-style checks in CI — platform teams love them.
110. MR pipelines vs branch pipelines  
   - **Hook:** "Why two pipelines on one push?"
   - **Core:** Understand GitLab MR pipeline behavior — avoid duplicate waste.
111. Merge trains / queue (concept)  
   - **Hook:** "Green MR broke main after merge."
   - **Core:** Queued retesting before merge reduces bit-rot — advanced feature awareness.
112. Mini checklist: trustworthy green  
   - **Hook:** "When is green actually safe?"
   - **Core:** Deterministic tests, no hidden allow_failure on critical jobs, fresh enough caches, required checks enforced.

---

## Module 7. Containers in CI (113–130)

113. Why build images in CI  
   - **Hook:** "Can’t developers build locally and push?"
   - **Core:** CI produces audited, repeatable images tagged by commit SHA.
114. Dockerfile as a build contract  
   - **Hook:** "CI build differs from my laptop."
   - **Core:** Same Dockerfile + pinned bases — local and CI converge.
115. Tag by digest / SHA  
   - **Hook:** "latest broke prod."
   - **Core:** Prefer immutable tags (`sha-abc1234`) over floating `latest`.
116. Multi-stage builds in CI  
   - **Hook:** "Image is 2GB."
   - **Core:** Build stage + slim runtime stage — faster pulls and smaller attack surface.
117. Build args vs secrets  
   - **Hook:** "API key as --build-arg?"
   - **Core:** Build-args can leak into history — use secret mounts/BuildKit patterns.
118. Docker layer caching in CI  
   - **Hook:** "Every build reinstalls the world."
   - **Core:** Cache mounts/registry cache — huge time saver when done right.
119. Rootless / least privilege builds  
   - **Hook:** "DinD needs privileged — is there another way?"
   - **Core:** Kaniko/Buildah/BuildKit rootless options reduce host risk.
120. Dockerfile lint  
   - **Hook:** "Hadolint in CI?"
   - **Core:** Catch bad practices before they hit the registry.
121. SBOM awareness  
   - **Hook:** "What’s in this image?"
   - **Core:** Software bill of materials helps incident and compliance response.
122. Base image pinning  
   - **Hook:** "`ubuntu:latest` changed under us."
   - **Core:** Pin digests for reproducibility; rebuild deliberately to pick up patches.
123. Healthcheck vs CI tests  
   - **Hook:** "HEALTHCHECK replaced our tests?"
   - **Core:** HEALTHCHECK is runtime; CI still needs unit/integration gates.
124. Compose in CI for integration  
   - **Hook:** "Need Redis for tests."
   - **Core:** Service containers/compose bring deps — clean up always.
125. Distroless / scratch runtimes  
   - **Hook:** "Why can’t I shell into prod images?"
   - **Core:** Smaller images, fewer tools for attackers — debug with ephemeral sidecars.
126. Signing images (concept)  
   - **Hook:** "How do we trust the artifact?"
   - **Core:** Cosign/signing + policy admission — advanced but interview-friendly.
127. Build once, promote many  
   - **Hook:** "We rebuild for staging and prod."
   - **Core:** Same artifact through envs — config changes, not rebuilds.
128. CI user vs runtime user  
   - **Hook:** "Container runs as root."
   - **Core:** Non-root USER in Dockerfile — CI should enforce it.
129. Debugging a failed image build  
   - **Hook:** "RUN step failed — how to dig?"
   - **Core:** Reproduce locally with same Dockerfile; check context `.dockerignore`.
130. Mini checklist: CI image build  
   - **Hook:** "Definition of done for build job?"
   - **Core:** Pinned base, multi-stage, SHA tag, no secrets in layers, lint, push to registry on success.

---

## Module 8. Registries and artifacts stores (131–142)

131. Container registry role  
   - **Hook:** "Where do images live after CI?"
   - **Core:** Registry stores tagged images for deployers and clusters to pull.
132. GitLab Container Registry basics  
   - **Hook:** "How does GitLab store our images?"
   - **Core:** Project registry + CI job token/login — wire auth carefully.
133. Login in CI without leaking  
   - **Hook:** "docker login printed the password."
   - **Core:** Use masked vars / credential helpers; never set -x around login.
134. Retention policies  
   - **Hook:** "Registry disk is full."
   - **Core:** Expire untagged/old SHA tags; keep release tags longer.
135. Package registries (npm, Maven, PyPI)  
   - **Hook:** "CI publishes libraries too?"
   - **Core:** Same idea: authenticated publish on tag/main with permissions.
136. Generic job artifacts vs registry  
   - **Hook:** "Should binaries go to registry?"
   - **Core:** Containers → registry; raw binaries → package/generic registry or releases.
137. Immutable releases  
   - **Hook:** "Someone retagged v1.0.0."
   - **Core:** Treat release tags as immutable; block overwrite.
138. Multi-arch images (brief)  
   - **Hook:** "Apple Silicon vs amd64 servers."
   - **Core:** Build/push manifests for needed archs — or standardize on one.
139. Pull through and mirrors  
   - **Hook:** "External registry outage blocked CI."
   - **Core:** Mirrors improve reliability and rate limits.
140. Provenance / who built this  
   - **Hook:** "Which pipeline produced this tag?"
   - **Core:** Labels/annotations with pipeline URL and commit SHA.
141. Cleanup jobs  
   - **Hook:** "Who deletes stale feature tags?"
   - **Core:** Scheduled cleanup prevents infinite growth.
142. Mini checklist: registry hygiene  
   - **Hook:** "Healthy registry looks like?"
   - **Core:** Auth least privilege, retention, immutable releases, SHA provenance, monitored size.

---

## Module 9. Environments and deploy (143–164)

143. What is a deploy job?  
   - **Hook:** "Is deploy just kubectl apply in CI?"
   - **Core:** It’s a controlled promote of a known artifact with visibility and permissions.
144. Environments: staging vs production  
   - **Hook:** "Why name environments in CI?"
   - **Core:** UI tracking, scoped variables, and deployment history.
145. Dynamic review apps (concept)  
   - **Hook:** "Per-MR environments?"
   - **Core:** Ephemeral envs for UI review — remember teardown jobs.
146. Manual prod gate  
   - **Hook:** "Auto-deploy to prod on every main commit?"
   - **Core:** Many teams require manual approval — automate everything before the button.
147. Deploy permissions  
   - **Hook:** "Interns can push to prod?"
   - **Core:** Protected environments + protected variables + role checks.
148. kubectl from CI (classic pattern)  
   - **Hook:** "Store kubeconfig in CI variables?"
   - **Core:** Works for labs; prefer short-lived Agent/OIDC in real platforms.
149. Helm upgrade in CI  
   - **Hook:** "Helm from pipeline?"
   - **Core:** Upgrade with values + image tag; `--atomic` / wait flags matter.
150. Health check after deploy  
   - **Hook:** "Job succeeded but app is 502."
   - **Core:** Smoke `curl`/kubectl rollout status before calling success.
151. Rollout status and timeouts  
   - **Hook:** "Deploy job exited before pods were Ready."
   - **Core:** Wait for rollout; fail the job on timeout.
152. Rollback story  
   - **Hook:** "Bad deploy — now what?"
   - **Core:** Re-deploy previous known-good tag; practice before you need it.
153. Database migrations in pipelines  
   - **Hook:** "Migrate in the same job as deploy?"
   - **Core:** Expand/contract patterns; never naive drop columns on the same push blindly.
154. Blue/green and canary (concepts)  
   - **Hook:** "How do big teams reduce risk?"
   - **Core:** Traffic shifting strategies — CI triggers, mesh/ingress executes.
155. Feature flags vs deploy  
   - **Hook:** "Ship dark code?"
   - **Core:** Decouple deploy from release with flags — CD becomes safer.
156. Infrastructure changes in CI  
   - **Hook:** "Terraform plan on MR?"
   - **Core:** Plan is CI-friendly; apply is gated — never auto-apply blind to prod.
157. `terraform plan` artifact  
   - **Hook:** "How do reviewers see infra diff?"
   - **Core:** Publish plan output as MR artifact/comment.
158. GitOps preview: CI shouldn’t kubectl forever  
   - **Hook:** "Is push-from-CI the end state?"
   - **Core:** Many platforms move to GitOps pull — next module.
159. Deployment frequency vs stability  
   - **Hook:** "Ship many times a day safely?"
   - **Core:** Small batches + automated tests + fast rollback.
160. Freeze windows  
   - **Hook:** "No deploys during Black Friday?"
   - **Core:** Calendar gates and change management — still keep hotfixes possible.
161. Observability hook after deploy  
   - **Hook:** "Deploy green, metrics red."
   - **Core:** Link dashboard/annotations; watch error rate post-deploy.
162. ChatOps notifications  
   - **Hook:** "How does Slack know about deploys?"
   - **Core:** Notify on start/fail/success with links to pipeline and env.
163. Idempotent deploys  
   - **Hook:** "Re-running deploy broke things."
   - **Core:** Same artifact + declarative apply should be safe to retry.
164. Mini checklist: safe deploy job  
   - **Hook:** "Definition of done?"
   - **Core:** Right artifact, gated env, wait healthy, smoke test, rollback known, secrets scoped.

---

## Module 10. GitOps: split CI and CD (165–180)

165. GitOps in one sentence  
   - **Hook:** "What is GitOps?"
   - **Core:** Desired state lives in Git; a controller continuously reconciles the cluster to it.
166. Push vs pull deploys  
   - **Hook:** "CI push kubectl vs Argo pull?"
   - **Core:** Pull keeps cluster credentials out of CI — big security win.
167. CI builds; CD syncs  
   - **Hook:** "What should CI still do?"
   - **Core:** Test, scan, build/push image, bump version in Git — not long-lived kube admin.
168. Manifest repo vs app repo  
   - **Hook:** "One repo or two?"
   - **Core:** App code vs config/manifests — teams differ; know the tradeoffs.
169. Image tag bump PR  
   - **Hook:** "How does a new image reach the cluster?"
   - **Core:** CI opens/merges a tag bump; GitOps applies it.
170. Drift detection  
   - **Hook:** "Someone kubectl-edited prod."
   - **Core:** Drift shows Git ≠ cluster; self-heal may revert.
171. Self-heal: blessing and curse  
   - **Hook:** "Why did my hotfix disappear?"
   - **Core:** Hotfixes must go through Git — or disable self-heal knowingly.
172. Argo CD Application (concept)  
   - **Hook:** "What does Argo watch?"
   - **Core:** Application CR points at Git source + destination cluster/namespace.
173. Sync waves / hooks (brief)  
   - **Hook:** "DB before app?"
   - **Core:** Ordering primitives exist — keep them simple at first.
174. Rollback in GitOps  
   - **Hook:** "How do we roll back?"
   - **Core:** Revert the Git commit / point at previous tag — history is the undo log.
175. Progressive delivery (concept)  
   - **Hook:** "Canary with GitOps?"
   - **Core:** Controllers (Argo Rollouts etc.) automate steps — CI still produces the artifact.
176. Access model: who can merge to deploy  
   - **Hook:** "Who controls production now?"
   - **Core:** Git permissions become deploy permissions — protect those branches hard.
177. Rendered manifests / server-side generate  
   - **Hook:** "Helm in GitOps?"
   - **Core:** Render or use Helm source carefully — reproducibility matters.
178. Secrets in GitOps  
   - **Hook:** "Do we commit sealed secrets?"
   - **Core:** Encrypted/sealed/SOPS/external secrets — never plain passwords in Git.
179. When push-from-CI is still OK  
   - **Hook:** "Must every team do GitOps?"
   - **Core:** Small labs and early stages may kubectl from CI — plan the migration path.
180. Mini checklist: CI/CD split  
   - **Hook:** "Are we doing GitOps for real?"
   - **Core:** Immutable images, Git desired state, pull reconciler, protected config repo, CI without cluster-admin forever.

---

## Module 11. Security in the pipeline (181–200)

181. Why CI is a high-value target  
   - **Hook:** "Attackers care about pipelines?"
   - **Core:** CI holds tokens and can push to prod — treat it like production.
182. Secret detection on MRs  
   - **Hook:** "Can CI stop accidental key commits?"
   - **Core:** Secret scanners fail the job before merge — enable early.
183. SAST basics  
   - **Hook:** "What is SAST?"
   - **Core:** Static analysis finds common code bugs/vulns without running the app.
184. Dependency scanning  
   - **Hook:** "Vulnerable npm package?"
   - **Core:** Lockfile scanning catches known CVEs — triage by severity.
185. Container scanning  
   - **Hook:** "Image has critical CVEs."
   - **Core:** Scan before promote; rebuild bases; accept risk consciously.
186. Blocking criticals vs noise  
   - **Hook:** "Everything is critical — team ignores it."
   - **Core:** Start by blocking true critical/high on new findings; tune policies.
187. Supply chain: malicious deps  
   - **Hook:** "Typosquatting packages?"
   - **Core:** Pin versions, review new deps, prefer private proxies.
188. Unsigned actions / templates  
   - **Hook:** "include: from random repo?"
   - **Core:** Third-party CI templates are code execution — pin refs/SHAs.
189. Fork PR isolation  
   - **Hook:** "External fork running on our runners?"
   - **Core:** Untrusted code needs isolated runners and limited secrets.
190. Least privilege job tokens  
   - **Hook:** "CI can push to any registry project?"
   - **Core:** Narrow scopes; separate read-build from deploy credentials.
191. SBOM + provenance again  
   - **Hook:** "Auditor asks what’s running."
   - **Core:** Generate and store SBOMs with releases.
192. Policy gates for Dockerfiles/K8s YAML  
   - **Hook:** "Ban :latest and privileged?"
   - **Core:** Conftest/OPA in CI encodes standards as code.
193. Dangerous `curl | bash` in jobs  
   - **Hook:** "Install script from the internet."
   - **Core:** Pin checksums or vendor tools — supply chain 101.
194. Log redaction  
   - **Hook:** "Token in pytest output."
   - **Core:** Masking helps; still avoid printing; review debug jobs.
195. Compliance artifacts  
   - **Hook:** "Prove what ran in prod."
   - **Core:** Keep pipeline links, image digests, and approvals.
196. Threat model a pipeline  
   - **Hook:** "Where can this job be abused?"
   - **Core:** Map secrets exposure, runner escape, and artifact tampering.
197. Security champions in MR review  
   - **Hook:** "Only AppSec looks at YAML?"
   - **Core:** DevOps + AppSec shared ownership — CODEOWNERS for CI files.
198. Incident: leaked CI variable  
   - **Hook:** "Variable appeared on a public fork pipeline."
   - **Core:** Rotate immediately, audit pushes, tighten protected settings.
199. DevSecOps is not a scanner checkbox  
   - **Hook:** "We added SAST — secure now?"
   - **Core:** Scanners + triage + fix SLAs + design reviews — culture, not tooling alone.
200. Mini checklist: security gate MVP  
   - **Hook:** "Minimum bar this quarter?"
   - **Core:** Secret detection, dependency scan, container scan on release images, protected prod vars, no privileged shared runners for forks.

---

## Module 12. Reliability, scale, and platform CI (201–216)

201. SLIs for pipelines  
   - **Hook:** "Is CI healthy?"
   - **Core:** Success rate, queue time, duration — monitor like an app.
202. Flaky infra vs flaky tests  
   - **Hook:** "Runner OOM vs test race?"
   - **Core:** Split signals; different owners and fixes.
203. Capacity planning runners  
   - **Hook:** "Monday morning queue spike."
   - **Core:** Autoscale + concurrency budgets per team.
204. Template versioning  
   - **Hook:** "Shared template broke 40 repos."
   - **Core:** Semver templates; don’t force :latest includes.
205. Pipeline as reusable product  
   - **Hook:** "Every team copies YAML."
   - **Core:** Golden templates + docs + migration guides.
206. Multi-tenant CI concerns  
   - **Hook:** "Team A reads Team B artifacts?"
   - **Core:** Isolation boundaries for caches, runners, and registries.
207. Disaster recovery for CI  
   - **Hook:** "GitLab is down — can we ship?"
   - **Core:** Break-glass build/deploy paths documented and rarely tested until needed — test them.
208. Rate limits and external APIs  
   - **Hook:** "Jobs fail calling Docker Hub/npm."
   - **Core:** Caching, mirrors, retries with backoff.
209. Observability of deploy jobs  
   - **Hook:** "Which deploy caused the spike?"
   - **Core:** Correlate pipeline ID, image digest, and metrics.
210. Change management lite  
   - **Hook:** "Do startups need CAB?"
   - **Core:** Lightweight peer review + automated gates often beat heavy ceremony.
211. Feature flags for pipeline changes  
   - **Hook:** "New CI template risks everyone."
   - **Core:** Opt-in variables / gradual rollout of template majors.
212. Cost showback  
   - **Hook:** "Who burns CI minutes?"
   - **Core:** Attribute minutes per team/project — incentives follow data.
213. Self-hosted vs SaaS CI  
   - **Hook:** "Why run our own runners?"
   - **Core:** Control/compliance/cost tradeoffs — hybrid is common.
214. API-driven pipelines  
   - **Hook:** "Trigger from elsewhere?"
   - **Core:** Pipeline APIs for mobile/game/content workflows — auth carefully.
215. Chaos: break CI in staging  
   - **Hook:** "Do we practice CI failure?"
   - **Core:** Game days for runner loss and registry outage.
216. Mini checklist: platform-ready CI  
   - **Hook:** "Beyond one app’s YAML?"
   - **Core:** Versioned templates, isolated runners, metrics, secret strategy, documented break-glass.

---

## Module 13. Culture, DORA, and collaboration (217–230)

217. DORA: deployment frequency  
   - **Hook:** "How often should we deploy?"
   - **Core:** Higher frequency with small batches usually increases stability — counterintuitive but measured.
218. DORA: lead time for changes  
   - **Hook:** "Commit to prod takes weeks?"
   - **Core:** Shrink wait states: review, CI queue, manual handoffs.
219. DORA: change fail rate  
   - **Hook:** "How many deploys hurt users?"
   - **Core:** Track incidents after deploy — improve tests and rollbacks.
220. DORA: time to restore  
   - **Hook:** "How fast can we recover?"
   - **Core:** Rollback paths and runbooks beat heroics.
221. You build it, you run it (CI angle)  
   - **Hook:** "Who owns a red main?"
   - **Core:** Teams own their pipeline health — platform enables, doesn’t babysit forever.
222. Reviewing `.gitlab-ci.yml` in MRs  
   - **Hook:** "Nobody reviews CI diffs."
   - **Core:** CI changes need the same scrutiny as app code — sometimes more.
223. Docs next to the pipeline  
   - **Hook:** "How do I run this locally like CI?"
   - **Core:** README section: required vars, how to reproduce jobs.
224. Inner loop vs outer loop  
   - **Hook:** "Pre-commit vs CI?"
   - **Core:** Fast local hooks optional; CI remains the source of truth.
225. Saying no to endless jobs  
   - **Hook:** "Can we add one more check?"
   - **Core:** Every job has a cost — demand ROI and ownership.
226. Blameless pipeline incidents  
   - **Hook:** "Who broke the build?"
   - **Core:** Fix systemic flake/capacity issues — not the last committer alone.
227. Onboarding: first green pipeline  
   - **Hook:** "New hire day-one goal?"
   - **Core:** Clone, push a tiny MR, see CI green — confidence builder.
228. Cross-team SLAs for shared CI  
   - **Hook:** "Template team is a bottleneck."
   - **Core:** Support channels, versioning, and self-service docs.
229. Metrics that matter to developers  
   - **Hook:** "What should we publish?"
   - **Core:** Time-to-green, queue time, flake rate — not vanity job counts.
230. Mini checklist: healthy CI culture  
   - **Hook:** "Culture smells?"
   - **Core:** Fast feedback, owned flakes, reviewed CI, protected prod, celebrated small releases.

---

## Module 14. Interviews, myths, what’s next (231–240)

231. Interview: explain your pipeline end-to-end  
   - **Hook:** "Walk me from commit to prod."
   - **Core:** Trigger → build/test → image → registry → env gate → deploy/GitOps → verify.
232. Interview: artifacts vs cache  
   - **Hook:** "They always ask this."
   - **Core:** Artifacts are outputs; cache is optimization — never rely on cache for correctness.
233. Interview: how do you manage secrets?  
   - **Hook:** "Where do credentials live?"
   - **Core:** Masked/protected vars → short-lived OIDC/Vault — no Git, no logs.
234. Interview: pending job diagnosis  
   - **Hook:** "Pipeline stuck — your steps?"
   - **Core:** Tags, runner online, concurrency, protections, quotas.
235. Interview: why not deploy from laptop?  
   - **Hook:** "What’s wrong with kubectl apply locally?"
   - **Core:** No audit trail, unreproducible, credential sprawl — CI/GitOps fixes that.
236. Myth: more jobs = more mature  
   - **Hook:** "We have 60 jobs!"
   - **Core:** Maturity is reliable signal and fast path — not job count.
237. Myth: green means secure  
   - **Hook:** "Pipeline passed."
   - **Core:** Green means configured checks passed — coverage gaps remain.
238. Portfolio: show a real pipeline  
   - **Hook:** "How do I prove CI skill?"
   - **Core:** Public sample with stages, tests, image build, and a write-up of failure modes.
239. What’s next after this course  
   - **Hook:** "Where do I go deeper?"
   - **Core:** Repo tracks: `gitlab-basic` → `intermediate` → `advanced`, `gitops-basic`, AppSec, Kubernetes deploy shorts.
240. Closing rule: automate the boring, verify the risky  
   - **Hook:** "One sentence to remember?"
   - **Core:** Automate build/test/ship; put humans and strong gates where mistakes are expensive — then measure DORA and iterate.

---

## Extra: template for every short

- Hook (3–5 sec): one pain/question  
- Core (~45–55 sec): 1 concept + failure mode + practical check  
- Lock-in (5–10 sec): YAML snippet / checklist / memorable rule  
- CTA: `Master CI/CD faster. Theory, hands-on labs, and interview questions - link in bio.`

On-screen YAML/command rule:
- One short job fragment or ≤6 YAML lines max  
- Huge font, high contrast — readable on a phone  
- No full pipeline dumps

Scene 1: large TopicBanner with the lesson topic title.

---

## How to publish for watch-through

- Ship by modules (series), not randomly  
- End each video by teasing the next lesson  
- Keep one visual style and module rubric  
- Show key YAML/commands large on screen  
- Make 1–2 diagnostic shorts for every 5 theory shorts (pending jobs, leaked secrets, failed deploy, flake vs infra)  
- Don’t skip modules: why CI/CD → Git/MR → pipeline → runners → secrets → artifacts → quality → images → registry → deploy → GitOps → security → reliability → culture  

Suggested pairing on the channel: **Linux** and **Docker** shorts feed this series; this series feeds **Kubernetes** and **GitOps** shorts.

Aligned courses in-repo: `courses/gitlab-basic`, `gitlab-intermediate`, `gitlab-advanced`, `gitops-basic`, `gitops-intermediate`, `devops-culture`, `appsec-fundamentals`.

Pipeline guide: `ci-cd-shorts-pipeline-prompt.md` (create from Go/K8s/Linux pipeline templates when you start rendering).
