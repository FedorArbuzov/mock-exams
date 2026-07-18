# Kubernetes Shorts: Complete beginner course

Goal: turn shorts into a coherent course that takes a beginner from terminology to confident practice.
Recommended length per video: **45–75 seconds** (target ~65–75 when the topic needs texture).

Shared CTA (end of every short — English publishing voice-over):
`Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.`

Module order = study order: big picture → local cluster → objects → kubectl → common errors → networking/resources → releases → storage → security → observability → scaling → Helm/Kustomize/GitOps → CI/CD → platform → career.

Pipeline guide: `kubernetes-shorts-pipeline-prompt.md`.

---

## Module 0. Start and orientation (1–12)

Format for every item in this and the following modules:
- **Hook:** a short beginner question/pain for the lesson topic.
- **Core:** a simple explanation + 1 practical anchor (command/rule/checklist).
- **CTA:** shared line above (do not invent a different CTA).

1. What is Kubernetes in 30 seconds  
   - **Hook:** "You already know Docker — why do you need Kubernetes?"
   - **Core:** Kubernetes automates running, healing, and scaling containers across a cluster.
2. Container vs Pod  
   - **Hook:** "Why does Kubernetes say Pod instead of just container?"
   - **Core:** A Pod is the smallest deployable unit; it can hold one or more containers.
3. Node vs Cluster  
   - **Hook:** "Are node and cluster the same thing?"
   - **Core:** A Cluster is a set of nodes; a Node is the server where Pods actually run.
4. Control Plane in plain words  
   - **Hook:** "Who makes decisions in the cluster?"
   - **Core:** The Control Plane manages cluster state and orchestrates workloads.
5. Worker Node and its role  
   - **Hook:** "Where does the application actually run?"
   - **Core:** Worker nodes run containers and execute the real workloads.
6. kubelet: who runs Pods on a node  
   - **Hook:** "What on the node watches the Pod?"
   - **Core:** kubelet applies cluster instructions and monitors Pod state locally.
7. API Server: the single control entrypoint  
   - **Hook:** "Where do all `kubectl` commands go?"
   - **Core:** The API Server is the central entry point for reading and changing resources.
8. etcd: where cluster state lives  
   - **Hook:** "Where is the 'source of truth' for the cluster?"
   - **Core:** etcd stores the current and desired state of Kubernetes objects.
9. scheduler: how a node is chosen  
   - **Hook:** "Why did this Pod land on that node?"
   - **Core:** The Scheduler picks a node based on resources and placement constraints.
10. Desired State: the core idea of Kubernetes  
   - **Hook:** "Why does Kubernetes fix drift by itself?"
   - **Core:** You declare desired state; controllers continuously reconcile the cluster to it.
11. When you do *not* need Kubernetes  
   - **Hook:** "Everyone runs k8s — does that mean I should too?"
   - **Core:** For one service or a tiny team, a VM/PaaS may be enough; k8s pays off as services and teams grow.
12. Myth: “Kubernetes = Docker on steroids”  
   - **Hook:** "It's just a container orchestrator, right?"
   - **Core:** Docker runs a container; Kubernetes manages the cluster, networking, desired state, and policies.

---

## Module 1. Hands-on local start (13–22)

13. Minikube / kind / k3s — what a beginner should pick  
   - **Hook:** "Which local cluster should I install without getting lost?"
   - **Core:** kind — fast Docker sandbox; minikube — friendly local UX; k3s — lightweight “almost prod”.
14. First cluster in 5 minutes (kind)  
   - **Hook:** "How do I get a working Kubernetes without the cloud?"
   - **Core:** Spin up a kind cluster and immediately verify with `kubectl get nodes`.
15. `kubeconfig` in plain words  
   - **Hook:** "What is that file without which `kubectl` stays silent?"
   - **Core:** kubeconfig stores cluster addresses, users, and contexts for API access.
16. Contexts: switching between clusters  
   - **Hook:** "How do I work with multiple clusters using one CLI?"
   - **Core:** A context selects the cluster + user + namespace pair for your commands.
17. Don't break prod: separate contexts  
   - **Hook:** "How do I avoid deploying to prod by accident?"
   - **Core:** Keep distinct contexts/names and always check `kubectl config current-context` before `apply`.
18. Image registry: where a Pod gets its image  
   - **Hook:** "Where does Kubernetes fetch the Docker image from?"
   - **Core:** kubelet pulls the image from a registry by the `image:` name; without registry access the Pod won't start.
19. `ImagePullSecrets`: private registry  
   - **Hook:** "How do I pull images from a private registry?"
   - **Core:** A docker-registry Secret referenced by the Pod/ServiceAccount grants access to private images.
20. Why you shouldn't use `latest`  
   - **Hook:** "Why does `latest` break release predictability?"
   - **Core:** You can't tell which version is actually running — pin a tag or digest.
21. ImagePullPolicy: when a new image is pulled  
   - **Hook:** "Why does the Pod start with old code after a deploy?"
   - **Core:** Pull policy controls when kubelet re-downloads the image.
22. Docker Compose → Kubernetes: how to map it mentally  
   - **Hook:** "I have a compose file — how should I think in k8s terms?"
   - **Core:** service ≈ Deployment+Service, volumes ≈ PVC, env ≈ ConfigMap/Secret.

---

## Module 2. Core objects (23–37)

23. Deployment: the right way to run an app  
   - **Hook:** "Why shouldn't I create Pods by hand?"
   - **Core:** A Deployment keeps the desired replica count and manages safe updates.
24. ReplicaSet: what's under a Deployment  
   - **Hook:** "Who actually watches Pod count?"
   - **Core:** A ReplicaSet keeps the actual number of Pods aligned with the desired count.
25. StatefulSet: when you need it for stateful apps  
   - **Hook:** "Why aren't databases usually deployed via Deployment?"
   - **Core:** StatefulSet gives stable Pod identities and sticky persistent storage.
26. DaemonSet: one Pod on every node  
   - **Hook:** "How do I put a logging agent on every node at once?"
   - **Core:** A DaemonSet ensures the same Pod runs on every matching node.
27. Job: a one-shot task  
   - **Hook:** "How do I run a migration once and finish?"
   - **Core:** A Job runs a finite task and records success or failure.
28. CronJob: a scheduled task  
   - **Hook:** "How do I automate a backup every night?"
   - **Core:** A CronJob creates Jobs on a schedule for recurring background work.
29. Namespace: how to separate environments  
   - **Hook:** "How do I keep dev and prod from mixing in one cluster?"
   - **Core:** A Namespace logically isolates resources for teams and environments.
30. Labels: basic resource organization  
   - **Hook:** "What does grouping in Kubernetes actually rely on?"
   - **Core:** Labels are key/value tags used by services and controllers to select resources.
31. Selectors: how objects find each other  
   - **Hook:** "How does a Service know which Pods get traffic?"
   - **Core:** Selectors match labels and link objects together.
32. Annotations: operational metadata  
   - **Hook:** "Where do I put metadata without affecting selectors?"
   - **Core:** Annotations store arbitrary metadata for tools and processes.
33. ConfigMap: external configuration  
   - **Hook:** "Why should config live outside the container image?"
   - **Core:** ConfigMap separates settings from code and makes config changes easier.
34. Secret: sensitive data  
   - **Hook:** "Where should I store passwords and tokens in Kubernetes?"
   - **Core:** Secret is meant for sensitive data and needs careful access control.
35. ServiceAccount: identity for a Pod  
   - **Hook:** "Whose identity does a Pod use to call the cluster API?"
   - **Core:** A ServiceAccount gives the workload an identity for RBAC access.
36. Service: stable networking for Pods  
   - **Hook:** "Pods change — how do I give the app a stable address?"
   - **Core:** A Service provides a stable endpoint and load-balances traffic across Pods.
37. Ingress: inbound HTTP/HTTPS traffic  
   - **Hook:** "How do I route external traffic by domains and paths?"
   - **Core:** Ingress defines HTTP/HTTPS routing rules to internal services.

---

## Module 3. YAML and kubectl basics (38–57)

38. YAML without pain: `apiVersion`, `kind`, `metadata`, `spec`  
   - **Hook:** "Why does one bad indent break the deploy?"
   - **Core:** These four blocks define the resource type, name, and desired state.
39. Declarative vs Imperative approach  
   - **Hook:** "Should I write YAML or click/command by hand?"
   - **Core:** Declarative is better for repeatability; imperative is useful for quick one-offs.
40. `kubectl get`: a beginner's first command  
   - **Hook:** "Where do I start after logging into a cluster?"
   - **Core:** `kubectl get` gives a quick list of objects and their basic statuses.
41. `kubectl get all`: why it isn't “everything”  
   - **Hook:** "Why are some resources missing from `get all`?"
   - **Core:** It shows a limited set; full visibility needs targeted queries.
42. `kubectl describe`: best first diagnostic step  
   - **Hook:** "Pod won't start — where do I look first?"
   - **Core:** `describe` shows events, failure reasons, and key resource details.
43. `kubectl logs` and `--previous`  
   - **Hook:** "The container crashed and current logs are empty?"
   - **Core:** `--previous` shows logs from the previous container run.
44. `kubectl exec`: targeted debug inside a container  
   - **Hook:** "How do I inspect the app environment from inside?"
   - **Core:** `exec` gives short-lived access to a container for diagnostics.
45. `kubectl port-forward`: local access to a service  
   - **Hook:** "How do I test a service without an external Ingress?"
   - **Core:** Port-forward temporarily maps a Pod/Service port to your machine.
46. `kubectl apply` vs `create`  
   - **Hook:** "Why does `create` fail on a second run?"
   - **Core:** `create` only creates; `apply` is idempotent create/update.
47. `kubectl delete`: what to delete correctly  
   - **Hook:** "I deleted a Pod and it came back — why?"
   - **Core:** Controllers recreate Pods, so you usually delete the owning resource.
48. `kubectl edit`: emergency cluster edits  
   - **Hook:** "How do I quickly fix a resource during a prod incident?"
   - **Core:** `edit` is fine for urgent fixes, but you must put the change back into Git.
49. `kubectl patch`: surgical changes  
   - **Hook:** "Need to change one field without a full YAML?"
   - **Core:** `patch` updates specific parts of an object with a minimal change.
50. `kubectl diff`: preview changes before apply  
   - **Hook:** "How do I see what will change in the cluster?"
   - **Core:** `diff` compares the manifest to live state before `apply`.
51. `kubectl explain`: docs right in the CLI  
   - **Hook:** "Forgot a `spec` field and don't want to open a browser?"
   - **Core:** `explain` shows the structure and field descriptions for a resource.
52. `kubectl api-resources`: which resources exist  
   - **Hook:** "How do I know which object types this cluster supports?"
   - **Core:** It lists API resources and their short names.
53. `kubectl get -o wide`: wider overview  
   - **Hook:** "Need node/IP/extra fields fast?"
   - **Core:** `-o wide` adds practical fields for quick diagnostics.
54. `kubectl get pods -A`: search all namespaces  
   - **Hook:** "Can't find the Pod — maybe wrong namespace?"
   - **Core:** `-A` shows resources across every namespace.
55. `kubectl cp`: copy files to/from a Pod  
   - **Hook:** "How do I pull a log file or config out of a container?"
   - **Core:** `kubectl cp` copies files between your machine and a Pod.
56. `kubectl wait`: waits in automation  
   - **Hook:** "How do I avoid sleep loops in CI scripts?"
   - **Core:** `wait` blocks until a resource reaches the desired condition.
57. Mini routine: 5 morning commands  
   - **Hook:** "What should an on-call engineer check first each day?"
   - **Core:** A quick daily check of Pods, Services, events, resources, and rollout status.

---

## Module 4. Statuses and errors everyone Googles (58–72)

58. How to read the Pod `STATUS` column  
   - **Hook:** "What do Running, Pending, CrashLoopBackOff mean?"
   - **Core:** STATUS is a short summary of Pod phase/conditions; details live in `describe` and Events.
59. `ContainerCreating` vs `Pending`  
   - **Hook:** "Pod isn't Running — is that already a failure?"
   - **Core:** Pending — not scheduled/ready yet; ContainerCreating — already on a node, creating the container.
60. `ErrImagePull` / `ImagePullBackOff`  
   - **Hook:** "Why won't the image download?"
   - **Core:** Check name/tag, registry, node network, and ImagePullSecrets.
61. `CreateContainerConfigError`  
   - **Hook:** "The Pod won't even start a container — what's broken?"
   - **Core:** Often a referenced ConfigMap/Secret is missing.
62. `CrashLoopBackOff` vs plain `Error`  
   - **Hook:** "Why is one failure Error and another CrashLoop?"
   - **Core:** CrashLoop means repeated restarts with backoff; Error means the current run exited with failure.
63. `RunContainerError`  
   - **Hook:** "Image pulled, but the container won't start?"
   - **Core:** Check the start command, volume mounts, and filesystem permissions.
64. Job `Completed` is normal  
   - **Hook:** "Job shows Completed — did it break?"
   - **Core:** For a Job, Completed means the task finished successfully.
65. Why `RESTARTS` keeps growing  
   - **Hook:** "Restarts climb but status is Running — what now?"
   - **Core:** Check liveness, OOM, process crashes, and `logs --previous`.
66. Events vs Logs: what to check first  
   - **Hook:** "Empty logs means no problem?"
   - **Core:** Events explain orchestration; logs show app behavior inside the container.
67. `kubectl get events --sort-by=.lastTimestamp`  
   - **Hook:** "How do I see fresh events instead of a mess?"
   - **Core:** Sorting by time puts the latest failure reasons first.
68. `kubectl top pods/nodes` and Metrics Server  
   - **Hook:** "How do I see CPU/memory right in the CLI?"
   - **Core:** `kubectl top` works when Metrics Server is installed in the cluster.
69. `kubectl debug` / ephemeral containers  
   - **Hook:** "There's no shell in the image — how do I debug?"
   - **Core:** An ephemeral container temporarily adds debug tools to a live Pod.
70. Breakdown: why a Pod is Pending (live format)  
   - **Hook:** "Stuck in Pending — where do I start?"
   - **Core:** Node resources → taints/tolerations → PVC → affinity → Events.
71. Breakdown: Service with no endpoints (live format)  
   - **Hook:** "Service exists but endpoints are empty — why?"
   - **Core:** Labels/selectors mismatch, Pod not Ready, or wrong namespace.
72. Checklist: 60 seconds into an incident  
   - **Hook:** "Service is down — which 4 commands first?"
   - **Core:** `get/describe` → Events → logs/--previous → endpoints/rollout.

---

## Module 5. Ports, env, and volumes without confusion (73–84)

73. `containerPort` ≠ `Service.port` ≠ `targetPort`  
   - **Hook:** "Which port goes where — endless confusion?"
   - **Core:** containerPort is in the container; port is on the Service; targetPort is where traffic hits the Pod.
74. Env in a Pod: `env` vs `envFrom`  
   - **Hook:** "When list variables one by one vs load them all?"
   - **Core:** `env` is selective; `envFrom` loads an entire ConfigMap/Secret as env vars.
75. ConfigMap as a file vs as env vars  
   - **Hook:** "Mount the config or put it in env?"
   - **Core:** Env is great for flags; volume mounts fit files and larger configs.
76. Secret mount vs env: what's safer in practice  
   - **Hook:** "Is a Secret in env okay?"
   - **Core:** Mounts are usually better: fewer process-list leaks and easier file-based rotation.
77. `subPath`: convenient and risky  
   - **Hook:** "Why mount a single file via subPath?"
   - **Core:** subPath mounts one file, but ConfigMap/Secret updates may not be picked up.
78. Projected volumes in one picture  
   - **Hook:** "Can I combine several sources into one volume?"
   - **Core:** A projected volume merges Secret/ConfigMap/DownwardAPI into one directory.
79. Downward API: a Pod learns about itself  
   - **Hook:** "How can an app learn its name, namespace, limits?"
   - **Core:** Downward API injects Pod metadata into env or files without hardcoding.
80. Multi-container Pod: talk over `localhost`  
   - **Hook:** "Two containers in one Pod — how do they reach each other?"
   - **Core:** Containers in a Pod share a network namespace, so they use localhost and shared ports.
81. Shared volume between app and sidecar  
   - **Hook:** "How does a sidecar read the main app's files?"
   - **Core:** A shared volume (often emptyDir) is the standard in-Pod data channel.
82. `readOnlyRootFilesystem`: why  
   - **Hook:** "Why make the root filesystem read-only?"
   - **Core:** It hardens against malware writes and forces explicit writable volumes for app needs.
83. `securityContext`: runAsNonRoot in 30 seconds  
   - **Hook:** "Why ban running as root?"
   - **Core:** non-root reduces blast radius if the container is compromised — basic Pod hygiene.
84. Capabilities: why drop `ALL`  
   - **Hook:** "What are Linux capabilities on a container?"
   - **Core:** Drop unused privileges and keep only the capabilities you truly need.

---

## Module 6. Networking without magic (85–110)

85. Service types: ClusterIP, NodePort, LoadBalancer  
   - **Hook:** "How do I choose the right Service type?"
   - **Core:** ClusterIP — in-cluster; NodePort — via nodes; LoadBalancer — external load balancer.
86. Why a Service can't see Pods (labels/selectors)  
   - **Hook:** "Service created, but no traffic — what's the catch?"
   - **Core:** Most often Pod labels and Service selectors don't match.
87. EndpointSlice: where endpoints are stored  
   - **Hook:** "How does a Service know backend Pod IPs?"
   - **Core:** EndpointSlice stores current backend Pod addresses for routing.
88. DNS in Kubernetes: how services find each other  
   - **Hook:** "Why can I call `my-service` without an IP?"
   - **Core:** Built-in DNS resolves service names to in-cluster addresses.
89. Service FQDN across namespaces  
   - **Hook:** "When is a short service name not enough?"
   - **Core:** For explicit cross-namespace addressing, use the full service DNS name.
90. Ingress vs Service: who owns which layer  
   - **Hook:** "Do Ingress and Service do the same thing?"
   - **Core:** Service handles internal networking; Ingress manages external HTTP/HTTPS entry.
91. Ingress Controller: why Ingress “doesn't work by itself”  
   - **Hook:** "I created an Ingress but nothing routes — why?"
   - **Core:** You need an Ingress Controller that implements Ingress rules.
92. Session Affinity: sticky client sessions  
   - **Hook:** "How do I keep a client on the same Pod?"
   - **Core:** Session Affinity sends repeat client requests to the same Pod.
93. `externalTrafficPolicy`: Local vs Cluster  
   - **Hook:** "Why is the client source IP lost?"
   - **Core:** Local helps preserve client IP; Cluster balances more broadly across nodes.
94. Headless Service: why skip load balancing  
   - **Hook:** "Why have a Service with no virtual IP?"
   - **Core:** A headless Service returns DNS records for individual Pods in stateful scenarios.
95. Stateful DNS for StatefulSet  
   - **Hook:** "How do stateful Pods get stable DNS names?"
   - **Core:** StatefulSet + Headless Service give predictable names per Pod.
96. NodePort for dev/test scenarios  
   - **Hook:** "How do I quickly expose a service without Ingress?"
   - **Core:** NodePort is fine for testing, usually not the best final prod choice.
97. Basic request path: user → Ingress → Service → Pod  
   - **Hook:** "Where does a request actually go after you open the site?"
   - **Core:** Traffic passes through routing layers until it hits a backend Pod.
98. Checking service reachability after deploy  
   - **Hook:** "How do I quickly know the service is really alive?"
   - **Core:** Check endpoints, Pod readiness, and a real application response.
99. Common beginner networking mistakes  
   - **Hook:** "Why does networking break in the most basic cases?"
   - **Core:** Bad ports, selectors, namespaces, and Ingress rules are the top causes.
100. Mini networking diagnostics checklist  
   - **Hook:** "Where do I start when there's 'no access'?"
   - **Core:** Service → Endpoints → Pod status → Logs → Ingress → DNS.
101. What to monitor first in the network  
   - **Hook:** "Which network metrics actually matter early on?"
   - **Core:** Errors, latency, endpoint availability, and traffic saturation.
102. Gateway API vs Ingress  
   - **Hook:** "Is Ingress obsolete — does everyone need Gateway API now?"
   - **Core:** Gateway API is a richer entry model; Ingress is still widely used.
103. TLS on Ingress: certificate in one minute (concept)  
   - **Hook:** "How do I enable HTTPS on inbound traffic?"
   - **Core:** Ingress references a TLS Secret with cert and key for the host.
104. cert-manager: who renews certificates  
   - **Hook:** "Who makes sure TLS doesn't expire?"
   - **Core:** cert-manager issues and renews certificates from cluster manifests.
105. HTTP → HTTPS redirect  
   - **Hook:** "How do I force users onto HTTPS?"
   - **Core:** Configure a redirect rule on the Ingress Controller/Gateway.
106. Path-based vs host-based routing  
   - **Hook:** "When split by domain vs by path?"
   - **Core:** Host for different apps/brands; path for parts of one domain.
107. Why 502/504 often aren't “in the app”  
   - **Hook:** "Site returns 502 — jump into code immediately?"
   - **Core:** First check upstream readiness, Service/endpoints, and Ingress timeouts.
108. External health checks vs internal readiness  
   - **Hook:** "External monitoring is green but traffic is already failing?"
   - **Core:** External probe ≠ readiness: watch both layers or you get false calm.
109. WAF/CDN in front of the cluster — where the boundary is  
   - **Hook:** "Does protection start in Kubernetes or earlier?"
   - **Core:** CDN/WAF cut external threats; NetworkPolicy and RBAC protect inside the cluster.
110. Canary via Ingress/Gateway (idea)  
   - **Hook:** "How do I send 5% of traffic to a new version?"
   - **Core:** Weight/header rules at the edge gradually shift traffic to canary.

---

## Module 7. Resources and Pod stability (111–128)

111. Requests and Limits: stability foundation  
   - **Hook:** "Why does the cluster start drifting without limits?"
   - **Core:** Requests reserve capacity; limits cap peak container consumption.
112. QoS: BestEffort, Burstable, Guaranteed  
   - **Hook:** "Which Pods die first under resource pressure?"
   - **Core:** QoS class affects which Pods survive when a node is under pressure.
113. OOMKilled: what it is and how to fix it  
   - **Hook:** "Container dies with no obvious app error?"
   - **Core:** OOMKilled means the memory limit was exceeded; revisit limits and memory profile.
114. Evicted Pod: why eviction happens  
   - **Hook:** "Pod suddenly vanished — bug or cluster policy?"
   - **Core:** Eviction happens under node memory/disk pressure to protect cluster stability.
115. Pending Pod: common causes  
   - **Hook:** "Why is the Pod stuck in Pending?"
   - **Core:** Usually missing resources, taint constraints, or PVC problems.
116. Liveness probe: “is the process alive”  
   - **Hook:** "How do I detect a hung container that needs a restart?"
   - **Core:** Liveness detects dead processes and triggers a Pod restart.
117. Readiness probe: “ready for traffic”  
   - **Hook:** "Why does the Service send traffic to an unready Pod?"
   - **Core:** Readiness keeps unready Pods out of Service load balancing.
118. Startup probe: for slow startups  
   - **Hook:** "App starts slowly and gets killed too early?"
   - **Core:** Startup probe gives a startup window without premature restarts.
119. CrashLoopBackOff: fast root-cause algorithm  
   - **Hook:** "Pod keeps restarting forever — what first?"
   - **Core:** Check `describe`, `logs --previous`, config/secrets, and the start command.
120. Graceful shutdown and `terminationGracePeriodSeconds`  
   - **Hook:** "How do I stop a Pod without dropping requests?"
   - **Core:** A proper grace period lets the app finish work and drain connections.
121. Why a Pod sticks in Terminating  
   - **Hook:** "I deleted the Pod but it won't disappear?"
   - **Core:** Causes include finalizers, long shutdown hooks, or volume issues.
122. Init Containers: prepare before start  
   - **Hook:** "How do I run checks before the main container starts?"
   - **Core:** Init containers run in order and prepare the app environment.
123. Sidecar pattern for helper tasks  
   - **Hook:** "Why put a second container next to the app?"
   - **Core:** A sidecar extracts helper work: proxying, logging, syncing.
124. EmptyDir for temporary data  
   - **Hook:** "Where do I store temp files inside a Pod?"
   - **Core:** EmptyDir lives as long as the Pod and fits cache/temp artifacts.
125. PodDisruptionBudget: protect availability  
   - **Hook:** "How do I avoid losing the service during node maintenance?"
   - **Core:** A PDB limits how many replicas can be unavailable at once.
126. PriorityClass: who to save first  
   - **Hook:** "Which Pods should survive under scarcity?"
   - **Core:** PriorityClass sets priority for critical workloads competing for resources.
127. ResourceQuota: namespace limits  
   - **Hook:** "How can one team accidentally eat the whole cluster?"
   - **Core:** ResourceQuota caps total resources and object counts in a namespace.
128. LimitRange: request/limit standards  
   - **Hook:** "How do I force consistent resource settings?"
   - **Core:** LimitRange sets mins, maxes, and defaults for Pod/container resources.

---

## Module 8. Scheduling and placement (129–140)

129. Taints: block scheduling onto a node  
   - **Hook:** "How do I stop ordinary Pods from landing on a special node?"
   - **Core:** A taint marks a node as restricted unless Pods have matching tolerations.
130. Tolerations: intentional exceptions  
   - **Hook:** "How do I let a specific Pod bypass a taint?"
   - **Core:** A toleration allows a Pod onto a tainted node under defined rules.
131. Affinity: place things together  
   - **Hook:** "How do I tell the scheduler: run near these services?"
   - **Core:** Affinity controls preferred/required placement by labels.
132. Anti-affinity: spread across nodes  
   - **Hook:** "How do I avoid putting all replicas on one server?"
   - **Core:** Anti-affinity spreads replicas across nodes for resilience.
133. Topology spread constraints: evenness across zones  
   - **Hook:** "Why can all Pods end up in one zone?"
   - **Core:** Spread constraints keep distribution more even across topology domains.
134. Cordon: stop new Pods on a node  
   - **Hook:** "How do I prepare a node for maintenance without new load?"
   - **Core:** Cordon marks a node unschedulable but leaves running Pods alone.
135. Drain: safely empty a node  
   - **Hook:** "How do I correctly take a node out of service?"
   - **Core:** Drain evicts Pods while respecting controllers and availability constraints.
136. Node maintenance without downtime  
   - **Hook:** "Can I upgrade nodes without dropping the service?"
   - **Core:** Combine PDB, cordon/drain, and rolling node maintenance.
137. Why a Pod landed on this exact node  
   - **Hook:** "How do I explain the scheduler's choice in a real case?"
   - **Core:** Look at resources, taints/tolerations, affinity, and scheduling events.
138. Placing critical vs non-critical services  
   - **Hook:** "How do I protect important services under scarcity?"
   - **Core:** Separate workloads by priority and node policy.
139. DaemonSet + tolerations: a common case  
   - **Hook:** "Why isn't the monitoring agent on every node?"
   - **Core:** Tainted nodes often need matching tolerations in the DaemonSet.
140. Mini scheduling checklist  
   - **Hook:** "What should I check before launching a new workload?"
   - **Core:** Resources, placement constraints, resilience, and eviction rules.

---

## Module 9. Releases and rollbacks (141–158)

141. Rolling Update: update without downtime  
   - **Hook:** "How do I ship a new version without a full stop?"
   - **Core:** Rolling Update replaces Pods gradually while keeping the service available.
142. `kubectl rollout status`: watch the release  
   - **Hook:** "How do I know if a release is still going or already broken?"
   - **Core:** The command shows current rollout state and progress.
143. `kubectl rollout history`: revision history  
   - **Hook:** "How do I know what to roll back to after a bad update?"
   - **Core:** Revision history helps pick a stable rollback point.
144. `kubectl rollout undo`: fast rollback  
   - **Hook:** "Release broke prod — how do I roll back in minutes?"
   - **Core:** Undo returns the Deployment to the previous (or specified) revision.
145. `kubectl set image`: quick image update  
   - **Hook:** "How do I change the app version without editing a file?"
   - **Core:** Set image updates the container image and starts a new rollout.
146. `rollout restart`: restart the grown-up way  
   - **Hook:** "How do I restart a Deployment without deleting Pods by hand?"
   - **Core:** Rollout restart triggers controlled Pod recreation.
147. Why `kubectl delete pod` is not a release  
   - **Hook:** "Can I update an app by deleting Pods?"
   - **Core:** That's an emergency move, not a managed release process.
148. `revisionHistoryLimit`: history vs cleanup  
   - **Hook:** "Why limit old revisions?"
   - **Core:** The setting controls rollback history size and resource clutter.
149. Blue/Green vs Rolling vs Canary  
   - **Hook:** "Which release strategy is enough to start?"
   - **Core:** Rolling is the default; Blue/Green is a fast switch; Canary carefully shifts traffic share.
150. Smoke test after deploy  
   - **Hook:** "Why doesn't a 'green deploy' prove the service works?"
   - **Core:** A mini post-rollout test confirms the critical user path.
151. “Before deploy” checklist  
   - **Hook:** "What should I check so I don't ship blind?"
   - **Core:** Image version, configs/secrets, resources, migrations, and a rollback plan.
152. “After deploy” checklist  
   - **Hook:** "What do I watch in the first minutes after release?"
   - **Core:** Rollout, errors, latency, readiness, and smoke checks.
153. Mini incident runbook  
   - **Hook:** "Service is down: which 5 steps right away?"
   - **Core:** Capture symptoms, check rollout/events/logs, and roll back if needed.
154. Top mistakes on the first release  
   - **Hook:** "Why do beginners often break their first prod deploy?"
   - **Core:** They often forget probes, resources, observability, and a rollback procedure.
155. Don't deploy to the wrong cluster (kube context)  
   - **Hook:** "How do I avoid shipping dev into prod?"
   - **Core:** Always verify current context/namespace before applying changes.
156. Progressive delivery at a basic level  
   - **Hook:** "How do I roll out carefully instead of to everyone at once?"
   - **Core:** Gradually increase traffic/replica share after quality signals look good.
157. Post-deploy smoke + health-check  
   - **Hook:** "How do I quickly prove a release really works?"
   - **Core:** Run a minimal user path and check probes/metrics.
158. Myth: “more replicas = always better”  
   - **Hook:** "I added replicas — so performance improved?"
   - **Core:** Without ready DB/limits/queues, extra replicas can amplify the bottleneck.

---

## Module 10. Storage and stateful (159–172)

159. PersistentVolume and PersistentVolumeClaim  
   - **Hook:** "How do I keep data if a Pod restarts?"
   - **Core:** A PV provides a volume; a PVC requests it for a workload.
160. StorageClass: dynamic volume provisioning  
   - **Hook:** "Why can't a PVC bind sometimes?"
   - **Core:** StorageClass defines how and with what parameters volumes are provisioned.
161. Access Modes: RWO/ROX/RWX  
   - **Hook:** "Can multiple Pods write to one volume at once?"
   - **Core:** Access mode defines how many nodes can use the volume and in which mode.
162. Reclaim Policy: Delete vs Retain  
   - **Hook:** "What happens to data after deleting a PVC?"
   - **Core:** Reclaim policy decides whether to delete the volume or keep it for recovery.
163. StatefulSet for databases  
   - **Hook:** "Why do databases need stable Pod names?"
   - **Core:** StatefulSet keeps instance identity and simplifies stateful operations.
164. Headless Service + StatefulSet  
   - **Hook:** "How do DB cluster members find each other via DNS?"
   - **Core:** A Headless Service gives each StatefulSet Pod its own DNS record.
165. Why HostPath is dangerous in prod  
   - **Hook:** "Why is a local node folder a bad prod idea?"
   - **Core:** HostPath ties data to one node and hurts portability.
166. PVC lifecycle in a real project  
   - **Hook:** "How does a PVC live from create to delete?"
   - **Core:** Understand claim states, binding, and how delete policy affects data.
167. What happens to data on Pod restart  
   - **Hook:** "After a restart, is data gone or still there?"
   - **Core:** Without an external volume data is ephemeral; with a PVC it survives restarts.
168. Job for backup: basic scenario  
   - **Hook:** "How do I run a one-off database backup in Kubernetes?"
   - **Core:** A Job runs backup as a controlled finite task.
169. CronJob for regular backups  
   - **Hook:** "How do I automate daily/weekly backups?"
   - **Core:** A CronJob launches backup Jobs on a schedule with no manual work.
170. Data restore basics  
   - **Hook:** "I have a backup — how do I know restore actually works?"
   - **Core:** Regularly test restore in a separate environment.
171. Storage antipatterns in Kubernetes  
   - **Hook:** "Which mistakes most often cause data loss?"
   - **Core:** No backups, wrong reclaim policy, and keeping state on emptyDir/hostPath.
172. Mini checklist for stateful services  
   - **Hook:** "What to check before putting stateful in prod?"
   - **Core:** Storage, backup/restore, resilience, and latency/error monitoring.

---

## Module 11. Security for beginners (173–192)

173. RBAC: the permissions model in Kubernetes  
   - **Hook:** "Why do I get `forbidden` even though I can reach the cluster?"
   - **Core:** RBAC defines who can do what, where, on which resources.
174. Role vs ClusterRole  
   - **Hook:** "When is a Role not enough and I need a ClusterRole?"
   - **Core:** Role is namespace-scoped; ClusterRole is cluster-wide.
175. RoleBinding vs ClusterRoleBinding  
   - **Hook:** "Permissions exist but don't work — what was forgotten?"
   - **Core:** A binding attaches a role to a user/group/ServiceAccount.
176. `kubectl auth can-i`: quick access check  
   - **Hook:** "How do I check a permission before trying the action?"
   - **Core:** The command quickly validates RBAC access before you run the operation.
177. ServiceAccount best practices  
   - **Hook:** "Why is running everything on the default ServiceAccount bad?"
   - **Core:** Prefer dedicated ServiceAccounts with the minimum required rights.
178. Secret: why base64 is not encryption  
   - **Hook:** "Is a base64 Secret actually secure?"
   - **Core:** Base64 is encoding; real security comes from access control and storage encryption.
179. Safe secret rotation (basics)  
   - **Hook:** "How do I rotate tokens without service downtime?"
   - **Core:** Rotation means updating the Secret, recreating Pods, and verifying readiness.
180. ConfigMap vs Secret: what goes where  
   - **Hook:** "Where is the line between normal config and a secret?"
   - **Core:** Public config → ConfigMap; sensitive data → Secret.
181. NetworkPolicy: restrict east-west traffic  
   - **Hook:** "How do I block unnecessary Pod-to-Pod connections?"
   - **Core:** NetworkPolicy defines explicit rules for who can talk to whom inside the cluster.
182. Least privilege instead of admin  
   - **Hook:** "Why is `cluster-admin` almost always a bad idea?"
   - **Core:** Least privilege reduces the blast radius of mistakes and compromise.
183. RBAC mistakes everyone makes  
   - **Hook:** "Which RBAC mistakes most often break security?"
   - **Core:** Broad wildcard permissions and shared accounts without isolation.
184. Pod Security Standards: Privileged / Baseline / Restricted  
   - **Hook:** "How do I quickly judge how dangerous a Pod is?"
   - **Core:** PSS defines levels of restrictions on container and host privileges.
185. Admission controllers / webhooks (concept)  
   - **Hook:** "Who can reject my YAML before it even runs?"
   - **Core:** The admission layer validates and mutates objects on create/update.
186. Policy-as-code idea (Kyverno/OPA overview)  
   - **Hook:** "How do I automatically ban dangerous manifests?"
   - **Core:** Policies-as-code check manifests in CI and/or at the API gate.
187. Basic threat thinking for k8s  
   - **Hook:** "Where do I start thinking about cluster risks?"
   - **Core:** Identify assets, likely attack paths, and minimum protective controls.
188. Myth: “Namespace = security isolation”  
   - **Hook:** "Does a Namespace protect teams from each other?"
   - **Core:** It's a logical boundary; without RBAC/NetworkPolicy there's little real isolation.
189. Myth: “a Secret in k8s is a safe”  
   - **Hook:** "I put it in a Secret — so I'm fine?"
   - **Core:** You still need RBAC, etcd encryption, rotation, and least access to secrets.
190. Security checklist before release  
   - **Hook:** "What to check before shipping so you don't open a hole?"
   - **Core:** Permissions, secrets, network rules, images, and critical Pod settings.
191. Security checklist after an incident  
   - **Hook:** "Incident closed — what next?"
   - **Core:** Rotate secrets, review permissions, capture lessons, update the runbook.
192. Multi-tenancy: namespace as a boundary  
   - **Hook:** "How do I share a cluster across teams at the start?"
   - **Core:** Namespace + RBAC + quotas is the minimum shared-use model.

---

## Module 12. Observability for beginners (193–204)

193. What Metrics Server is  
   - **Hook:** "Why does `kubectl top` show nothing?"
   - **Core:** Metrics Server collects resource metrics from nodes/Pods for HPA and the CLI.
194. Prometheus: why it exists in the k8s world  
   - **Hook:** "Why a separate metrics system if `describe` exists?"
   - **Core:** Prometheus stores time series and alerts on trends, not just snapshots.
195. Grafana: what a junior should look at  
   - **Hook:** "Which dashboard should I open first?"
   - **Core:** Start with the service's RED/Golden Signals and Pod/node utilization.
196. Logs: stdout is the standard  
   - **Hook:** "Where should a Kubernetes app write logs?"
   - **Core:** Write to stdout/stderr — the logging agent/platform will collect them.
197. Why logs “vanish” after a Pod restart  
   - **Hook:** "I restarted the Pod and log history disappeared?"
   - **Core:** Local logs are ephemeral; you need centralized collection outside the Pod.
198. Tracing in one sentence  
   - **Hook:** "Metrics are green but the request is still slow — what next?"
   - **Core:** A trace shows the request path across services and where time is lost.
199. Alerts: the first 3 rules  
   - **Hook:** "Which alerts should I start with so I don't drown?"
   - **Core:** High error rate, readiness failures, and CPU/memory saturation.
200. “Deployment health” dashboard  
   - **Hook:** "What should be on one on-call screen?"
   - **Core:** Ready replicas, restarts, latency/errors, rollout status.
201. How to tell an app bug from a k8s problem  
   - **Hook:** "Is it the code or the cluster?"
   - **Core:** Compare Events/node resources with app logs and metrics.
202. Latency p95/p99: why average isn't enough  
   - **Hook:** "Average latency looks fine but users complain — why?"
   - **Core:** Tail percentiles show the real experience of the worst requests.
203. Error rate: basic threshold setup  
   - **Hook:** "When is rising error rate already critical?"
   - **Core:** Threshold and observation window must account for the system's normal error background.
204. Golden Signals: 4 required metrics  
   - **Hook:** "Which metrics cover basic service health?"
   - **Core:** Latency, traffic, errors, saturation — the minimum monitoring standard.

---

## Module 13. Scaling and performance (205–218)

205. `kubectl scale`: manual scale in seconds  
   - **Hook:** "Load spiked — what can I do right now?"
   - **Core:** Manual scale quickly changes replica count until autoscaling is set up.
206. HPA on CPU: first autoscaling  
   - **Hook:** "How do I automatically add Pods as load grows?"
   - **Core:** HPA increases/decreases replicas by target metrics; CPU is the easiest start.
207. HPA on custom metrics (concept)  
   - **Hook:** "CPU is low but the queue is growing — how do I scale right?"
   - **Core:** Use HPA on business metrics (for example, queue length).
208. VPA: auto-sizing Pod resources  
   - **Hook:** "How do I stop guessing requests/limits by hand?"
   - **Core:** VPA analyzes usage and recommends/applies new resource sizes.
209. HPA vs VPA: when to use which  
   - **Hook:** "Scale replicas or container size?"
   - **Core:** HPA is horizontal growth; VPA is vertical tuning.
210. Saturation: spotting the approach to limits  
   - **Hook:** "How do I notice a problem before an outage?"
   - **Core:** Watch CPU/memory/IO load and throttling as early degradation signals.
211. App bottleneck vs infrastructure bottleneck  
   - **Hook:** "Is the problem in code or in the cluster?"
   - **Core:** Compare app metrics with node metrics to localize the bottleneck.
212. Top causes of performance degradation  
   - **Hook:** "Why did the service suddenly get slow?"
   - **Core:** Often resource limits, external dependencies, bad queries, and queues.
213. Load optimization checklist  
   - **Hook:** "How do I speed a service up systematically?"
   - **Core:** Go step by step: metrics → hypothesis → change → validate → roll back if needed.
214. Myth: “safer without Limits”  
   - **Hook:** "If I skip limits, the Pod won't get killed?"
   - **Core:** Without limits one Pod can eat a node; limits protect neighbors and the cluster.
215. SLO/SLA in plain words  
   - **Hook:** "How do we agree what 'the service is healthy' means?"
   - **Core:** SLO is an internal reliability target; SLA is an external customer commitment.
216. Runbook: capturing team knowledge  
   - **Hook:** "How do we stop solving the same incident from scratch?"
   - **Core:** A runbook records diagnosis and recovery steps for repeatable situations.
217. Postmortem for beginners: no blame  
   - **Hook:** "How do we review incidents so the team grows?"
   - **Core:** Focus on system and process causes, not finding someone to blame.
218. On-call checklist: what to watch each hour  
   - **Hook:** "First on-call — what should I stare at?"
   - **Core:** Alerts, error rate, restarts, pending Pods, fresh Events.

---

## Module 14. Helm and repeatable releases (219–230)

219. Helm: why you need it on top of YAML  
   - **Hook:** "Tired of copying dozens of YAML files between projects?"
   - **Core:** Helm templates manifests and makes releases repeatable.
220. What a chart and a release are  
   - **Hook:** "Chart vs release — what's the difference?"
   - **Core:** A chart is an app template; a release is a concrete installed instance in the cluster.
221. Chart structure: `templates`, `values`, `Chart.yaml`  
   - **Hook:** "What are the files in a Helm chart and what do they do?"
   - **Core:** Templates generate manifests, values set parameters, Chart.yaml describes the package.
222. `values.yaml`: managing environments  
   - **Hook:** "How do I deploy one chart to both dev and prod?"
   - **Core:** Swap values files per environment without rewriting templates.
223. `helm install`: first release  
   - **Hook:** "How do I launch an app with Helm in one command?"
   - **Core:** Install creates a release from a chart with given values.
224. `helm upgrade`: updates  
   - **Hook:** "How do I safely update a chart or config?"
   - **Core:** Upgrade applies a new release revision with change history.
225. `helm rollback`: rollback  
   - **Hook:** "How do I quickly return to a working version after a bad upgrade?"
   - **Core:** Rollback restores a previous release revision.
226. `helm history`: release revisions  
   - **Hook:** "How do I see which versions were already rolled out?"
   - **Core:** History lists revisions and statuses for analysis and rollback.
227. Environment variables through values  
   - **Hook:** "How do I conveniently parameterize images, ports, and flags?"
   - **Core:** Use values for centralized env and Deployment parameter settings.
228. Common templating mistakes  
   - **Hook:** "Why does the chart render differently than expected?"
   - **Core:** Bad key names, indentation, and conditionals break the final YAML.
229. Helm + CI/CD basic scenario  
   - **Hook:** "How do I wire Helm into an automatic pipeline?"
   - **Core:** Pipeline builds the image, updates values, and runs a controlled `helm upgrade`.
230. Checklist: “chart ready for prod”  
   - **Hook:** "When is a chart production-ready?"
   - **Core:** You need values validation, resources, probes, a rollback plan, and docs.

---

## Module 15. Kustomize and GitOps (231–240)

231. Kustomize vs Helm: when to use which  
   - **Hook:** "Helm templates or Kustomize overlays?"
   - **Core:** Kustomize shines at template-free patches; Helm shines at packaging and release parameterization.
232. `kustomization.yaml` in 30 seconds  
   - **Hook:** "What sits at the root of a kustomize project?"
   - **Core:** It describes resources, patches, and generators for the final manifests.
233. Overlays: base / dev / prod  
   - **Hook:** "How do I avoid copying YAML for every environment?"
   - **Core:** Share a base; overlays add only environment differences.
234. `kubectl apply -k`  
   - **Hook:** "How do I apply kustomize without extra tools?"
   - **Core:** `apply -k` renders and applies a kustomization directory in one command.
235. Patches without copy-pasting manifests  
   - **Hook:** "Need to change only image and replicas?"
   - **Core:** Strategic/JSON patches surgically change fields on top of base.
236. ConfigMapGenerator / SecretGenerator  
   - **Hook:** "How do I avoid hand-creating a ConfigMap on every file change?"
   - **Core:** Generators build objects from files and help keep references updated.
237. Why hand-editing prod is bad  
   - **Hook:** "I did `kubectl edit` in prod — now what?"
   - **Core:** The cluster drifts from Git; the next deploy may wipe your fix.
238. Drift: cluster left Git behind  
   - **Hook:** "How do I know the cluster no longer matches the repo?"
   - **Core:** Compare live state to Git via diff/a GitOps controller.
239. Argo CD / Flux — GitOps idea in one picture  
   - **Hook:** "Who applies manifests if not a human?"
   - **Core:** A GitOps agent syncs desired state from Git into the cluster.
240. PR → sync → cluster  
   - **Hook:** "What does a GitOps workday look like?"
   - **Core:** Change via Pull Request, merge, automatic sync, then health checks.

---

## Module 16. CI/CD and delivery into the cluster (241–248)

241. Pipeline: build → push → deploy  
   - **Hook:** "What does a minimal working CI/CD for Kubernetes look like?"
   - **Core:** Build an image, push to a registry, deploy the new version to the cluster.
242. GitOps mindset: change via Git, not by hand  
   - **Hook:** "Why are manual cluster edits dangerous?"
   - **Core:** Source of truth should be Git so changes are visible and repeatable.
243. How to add a smoke test to the pipeline  
   - **Hook:** "Deploy succeeded — immediately 'green'?"
   - **Core:** After deploy, run a short health/smoke check before calling the release successful.
244. Secrets in CI: what not to do  
   - **Hook:** "Can I store kubeconfig in plain text in CI?"
   - **Core:** Keep secrets in the CI secret store; least privilege, short TTL, access audit.
245. Image versioning in the pipeline  
   - **Hook:** "Which tag should CI put on an image?"
   - **Core:** Use git sha/semver; never rely on `latest` for prod.
246. Rollback from CI vs rollback from the cluster  
   - **Hook:** "Where is the better place to hit rollback?"
   - **Core:** Prefer rollback via Git/pipeline; `rollout undo` is an emergency accelerator.
247. Preview environments from PRs (concept)  
   - **Hook:** "How do I test a feature before merge?"
   - **Core:** A temporary namespace/release per PR reduces surprises in main.
248. Production pipeline checklist  
   - **Hook:** "When is a pipeline ready for prod?"
   - **Core:** Build, scan, deploy, smoke, alerts, and a clear rollback path.

---

## Module 17. CRDs, Operators, and platform (249–258)

249. CRD: custom resources in the API  
   - **Hook:** "Why do weird kinds appear in the cluster?"
   - **Core:** A CRD extends the Kubernetes API with new resource types for your domain.
250. Operator pattern in plain words  
   - **Hook:** "Who keeps the 'desired state' of complex apps?"
   - **Core:** An Operator is a controller that encodes product operational knowledge (DBs, queues, etc.).
251. Why Operators for DBs/queues  
   - **Hook:** "Why are DBs in k8s often installed via Operator?"
   - **Core:** An Operator automates backups, failover, upgrades, and day-2 routines.
252. Internal developer platform in one analogy  
   - **Hook:** "What is an IDP and why do teams need it?"
   - **Core:** A platform provides paved paths (deploy/logs/secrets) so teams don't rebuild k8s from scratch.
253. Platform engineering: who builds the “Deploy” button  
   - **Hook:** "Who should build golden paths for developers?"
   - **Core:** A platform team packages safe, convenient self-service workflows.
254. What a junior Kubernetes engineer should know  
   - **Hook:** "Which skills actually matter at career start?"
   - **Core:** Basics of manifests, kubectl, diagnostics, networking, resources, and releases.
255. 3-month growth plan in Kubernetes  
   - **Hook:** "How do I level up in k8s fast and systematically?"
   - **Core:** Learn in sprints: theory, sandbox practice, mini-projects, and incident reviews.
256. Top 10 questions in a k8s junior interview  
   - **Hook:** "What gets asked most often?"
   - **Core:** Pod/Deployment/Service, probes, requests/limits, networking, RBAC, and Pending/CrashLoop debugging.
257. Explain Deployment in 30 seconds (interview answer)  
   - **Hook:** "What does a strong short answer sound like?"
   - **Core:** A Deployment keeps N app replicas and updates them safely via ReplicaSet.
258. Final short: roadmap to the next level  
   - **Hook:** "What should I learn after a basic Kubernetes course?"
   - **Core:** Security hardening, GitOps, observability, Operators, and platform engineering.

---

## Module 18. Interview drills and consolidation (259–266)

259. “What happens if you kill kubelet?”  
   - **Hook:** "A favorite interviewer trick question"
   - **Core:** New Pods on that node won't be managed correctly; already running containers may keep going, but state control breaks.
260. “How is Service different from Ingress?”  
   - **Hook:** "One question — and the level is obvious"
   - **Core:** Service is stable L4 access to Pods; Ingress is external HTTP routing.
261. “Requests vs Limits” — ideal answer  
   - **Hook:** "How do I answer short and correctly?"
   - **Core:** Requests reserve for the scheduler; Limits cap runtime; together they drive QoS.
262. Myth roundup: 5 dangerous beginner shortcuts  
   - **Hook:** "Which beliefs most often fail in prod?"
   - **Core:** latest is safe; namespace = security; Secret = vault; no limits is safer; more replicas always saves you.
263. Checklist: ready for a junior role  
   - **Hook:** "How do I know the basics are enough?"
   - **Core:** You can deploy a service, explain networking, fix Pending/CrashLoop, and roll back a release.
264. Mini project: one app end-to-end  
   - **Hook:** "How do I lock in the whole course?"
   - **Core:** Deployment + Service + Ingress + Config/Secret + probes + HPA + pipeline.
265. Mini project: break it and fix it  
   - **Hook:** "How do I train diagnostics?"
   - **Core:** Intentionally break selectors/ports/secrets and recover with a checklist.
266. What next after the course  
   - **Hook:** "Where do I go when the shorts are done?"
   - **Core:** Your own sandbox cluster, incident reviews, a CKA path, and platform work with your team.

---

## Extra: template for every short

- Hook (3–5 sec): one pain/question  
- Core (~45–55 sec): 1 concept + failure modes + practical check  
- Lock-in (5 sec): command/checklist / memorable rule  
- CTA: `Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.`

Target length per short: **~65–75 seconds**. Scene 1 shows a large topic title (TopicBanner).

---

## How to publish for watch-through

- Ship by modules (series), not randomly  
- End each video by teasing the next lesson  
- Keep one visual style and module rubric  
- Show key commands large on screen  
- Make 1–2 diagnostic shorts for every 5 theory shorts  
- Don't skip modules: local cluster → objects → kubectl → errors → networking → continue down the list  

Pipeline guide: `kubernetes-shorts-pipeline-prompt.md`.  
Shared Remotion channel standards (also used by Go): see that file + `golang-shorts-pipeline-prompt.md`.
