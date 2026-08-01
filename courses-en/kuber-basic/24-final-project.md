# 24. Final project: lift a startup off VMs into Kubernetes

## What this assignment is

This finale is a **compilation of the whole course** — one story where you use almost everything from **Kubernetes Basic** together, not a new topic.

| You learned (lessons) | You use here |
|---|---|
| Pods, YAML, labels ([5–7](06-pods-yaml.md)) | Pod template in every Deployment |
| ReplicaSet / Deployment ([8–11](10-deployment.md)) | `web`, `api`, `admin` Deployments |
| ConfigMap & Secret ([12–13](12-config-and-secret.md)) | `app-config`, `app-secret` |
| Probes & resources ([14–15](14-probes-and-resources.md)) | `livenessProbe`, `readinessProbe`, `resources` on each app |
| Service, ClusterIP, NodePort ([16–17](16-service.md)) | app Services + practice `edge` |
| Namespace ([18–19](18-namespace.md)) | `lab-final` |
| Ingress & controller exposure ([20–21](20-ingress.md)) | Helm controller + Ingress `shop` |
| Troubleshooting mindset ([22–23](22-troubleshooting.md)) | 502 / 404 / 401 / ImagePull — read signals, fix wiring |

If a step feels unfamiliar, open the lesson in the table — the finale assumes you already did the labs.

## Story

You joined **Nimbus Cart**. The shop used to run on virtual machines. Now the company wants the same thing in Kubernetes: a public storefront, an API, and a password-protected admin page.

The platform team already prepared **two empty nodes** and an **edge load balancer** (a small nginx container outside the cluster). Your job is to put the apps and the Kubernetes networking pieces inside the cluster so that LB finally reaches them.

You write the YAML yourself. Mentors care that you understand *why* each object exists — not that you copy a ready-made repo.

**Assumption for this finale:** the three app Deployments (`web`, `api`, `admin`) all run **nginx**. That is only to keep packaging simple. The real focus is ConfigMap, Secret, Services, Ingress Controller, Ingress rules, and NodePort — not writing application code.

> **Interactive check.** In `mockctl web`: **Start lab** → build the stack → **Check**. **Cleanup** deletes `lab-final`.

---

## What is already done for you (edge LB)

Bring the stand up once:

```bash
mockctl down
mockctl up --nodes 2 --no-addons --lb
# if port 8080 is busy on your PC:
# mockctl up --nodes 2 --no-addons --lb --lb-port 8082
```

What that means in plain words:

| Piece | Who owns it | Role |
|---|---|---|
| 2 minikube nodes | `mockctl` | Empty workers — no Ingress Controller, no apps |
| Edge LB (`mockctl-lb`) | `mockctl` | nginx on your PC: `http://localhost:<lb-port>/` |
| LB upstream target | `mockctl` | Always **nodeIP:`32080`** on every node |

The path from the browser:

```text
Browser → localhost:<lb-port>     (edge LB, already running)
       → nodeIP:32080             (fixed NodePort — you must open this on the Ingress Controller)
       → Ingress Controller Pod
       → (your) Ingress rules → Services → Pods
```

Until you install an Ingress Controller **with NodePort 32080**, nothing listens on those node ports → **`curl` returns 502**. That is expected.

After the controller listens on **32080**, the same LB URL stops being 502 (usually **404** until your Ingress rules exist).

| Code from LB URL | Meaning |
|---|---|
| **502** | Edge LB works; nothing on nodeIP:**32080** yet |
| **404** | Controller works; your Ingress rules not ready yet |
| **401** on `/admin` | Basic auth works (no / wrong password) |
| **200** + content | App answers through Ingress |

You do **not** need to run `mockctl up` again. Configure the controller Service with **`nodePort: 32080`** for port 80.

---

## What the product must look like

All checks go through the edge LB:

| URL | What the user should see |
|---|---|
| `/` | Storefront HTML (from ConfigMap) |
| `/api` | API response (JSON is fine) |
| `/admin` | Admin page, but **only after password**. Browser shows a login popup (HTTP Basic Auth) |

---

## Fixed values (so Check / mentor know what to expect)

### ConfigMap `app-config`

Must have key **`index.html`**. Content must include this storefront text (you may wrap it in a full HTML document):

- heading: **Nimbus Cart**
- paragraph: **We moved off VMs — checkout opens soon.**

Mount that file into the **web** Pod and serve it on `/`.

### Secret `app-secret`

Must have key **`password`** with value:

```text
nimbus-admin-2026
```

Use this password for Ingress basic auth on `/admin` (username e.g. `admin`).  
Ingress-nginx needs an htpasswd-style Secret (key usually `auth`) — build it from this password yourself (hint: `htpasswd`). The password that works in the browser / `curl -u` must still be `nimbus-admin-2026`.

Demo:

```bash
curl http://localhost:<lb-port>/admin                    # → 401
curl -u admin:nimbus-admin-2026 http://localhost:<lb-port>/admin   # → 200
```

### Ingress Controller NodePort (contract with the LB)

The edge LB is hard-wired to **32080**. Install the controller with **Helm** (see Step 2) so Service port **80** uses **`nodePort: 32080`**. Until that port is open, the LB keeps returning **502**.

---

## Your work — what to build and why (no ready YAML)

Do this in order. Platform networking first (so the LB path works), then apps, then routing rules.

For each step: create objects, apply them (`kubectl apply -f …`), verify with `kubectl get …`.

### Step 1. Namespace

Create namespace **`lab-final`**.  
Why: keep the project in one place; Check looks here.

### Step 2. Ingress Controller (Helm)

Install **ingress-nginx** with Helm **right after the namespace** — apps are not required yet. Helm creates its own namespace `ingress-nginx`. Do **not** use the minikube ingress addon.

Need Helm on your PATH (`helm version`). If missing: https://helm.sh/docs/intro/install/

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=32080
```

Wait and verify:

```bash
kubectl -n ingress-nginx get pods -w
# until ingress-nginx-controller-... is 1/1 Running, then Ctrl+C

kubectl -n ingress-nginx get svc
# ingress-nginx-controller → 80:32080/TCP
```

Checkpoint: `curl http://localhost:<lb-port>/` should change from **502** to **404**.

Why: the edge LB already points at **32080**. Once the controller listens there, traffic reaches Kubernetes even before your shop exists.

### Step 3. NodePort Service `edge` (practice)

Still early — before Deployments is OK. In **`lab-final`**, create Service **`edge`**, type **NodePort** (pick a free port in 30000–32767, **not** 32080).  
Point the selector at the app you will deploy later (e.g. `web` labels). Endpoints stay empty until Pods exist — that is normal.

Why: learn the “open a port on the node” model from the old VM world. Main traffic still goes through Ingress + LB; `edge` is a separate exercise for the mentor Q&A.

### Step 4. ConfigMap and Secret

In **`lab-final`**:

- ConfigMap **`app-config`** with `index.html` (storefront text above).  
- Secret **`app-secret`** with `password=nimbus-admin-2026`.  

Why: on VMs this lived in files on disk; in Kubernetes config and secrets are objects.

### Step 5. Deployments (the apps)

Create three Deployments: **`web`**, **`api`**, **`admin`**. Each must become Ready (≥1 Pod).

**Lab assumption:** all three Deployments use a plain **`nginx`** image (e.g. `nginx:1.27-alpine`). In a real product you would build separate app images; for this finale we only practice Kubernetes wiring, so nginx is enough.

| App | Job with nginx |
|---|---|
| **web** | Mount ConfigMap `index.html` (e.g. into `/usr/share/nginx/html/`) and serve it on `/` |
| **api** | Serve a simple JSON or static response that will sit behind `/api` (your choice how — custom default page, or a tiny static file) |
| **admin** | Simple stub page; **password is not inside the app** — Ingress will ask for it |

**Probes (lessons 14–15)** — on **every** container (`web`, `api`, `admin`):

| Probe | Requirement |
|---|---|
| **readinessProbe** | `httpGet` on `/`, port `80` — Pod joins Service endpoints only when nginx answers |
| **livenessProbe** | `httpGet` on `/`, port `80` — kubelet restarts the container if checks fail |

Set sensible timing yourself (`initialDelaySeconds`, `periodSeconds`, `failureThreshold`). `startupProbe` is optional for nginx.

**Resources (lessons 14–15)** — on **every** container, set both **requests** and **limits**:

| | Minimum (per container) |
|---|---|
| `resources.requests.cpu` | `50m` |
| `resources.requests.memory` | `64Mi` |
| `resources.limits.cpu` | `200m` |
| `resources.limits.memory` | `128Mi` |

Mentor may ask: `kubectl describe pod …` — show probes and resources in the container spec.

Why: Deployment replaces “install and run a process on a VM.” Probes and limits are what make the app “production-shaped” in Kubernetes, not just a bare Pod.

### Step 6. ClusterIP Services

One Service per app, same names: **`web`**, **`api`**, **`admin`**, type **ClusterIP**.  
Selectors must match Pod labels.

Why: stable name inside the cluster so Ingress can send traffic to the right Pods. After this step, Service `edge` (if it selects `web`) should show endpoints too.

### Step 7. Ingress rules

Create Ingress **`shop`** in `lab-final`:

- `/` → Service `web`
- `/api` → Service `api`
- `/admin` → Service `admin`
- Prefer **no** `host` so `localhost` works through the LB
- Put `/api` and `/admin` **before** `/` (more specific paths first)
- Protect **`/admin` only** with HTTP Basic Auth using the password from step 4 (htpasswd Secret + Ingress annotations)

Why: this replaces the old edge VM’s nginx `location` blocks and admin password gate.

### Step 8. Smoke-test and Check

```bash
curl -s http://localhost:<lb-port>/
curl -s http://localhost:<lb-port>/api
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:<lb-port>/admin
curl -s -u admin:nimbus-admin-2026 http://localhost:<lb-port>/admin
```

Then press **Check** in the Interactive lab panel.

---

## How to apply manifests

You invent the files. Typical layout:

```text
nimbus-cart-k8s/
├── README.md
├── namespace.yaml
├── networking/
│   ├── ingress-controller-helm.md   # commands from Step 2
│   ├── edge-nodeport.yaml           # Step 3
│   ├── admin-auth-secret.yaml       # Step 7
│   └── ingress.yaml                 # Step 7
├── config/                          # Step 4
└── apps/                            # Steps 5–6
```

Apply in step order:

```bash
kubectl apply -f namespace.yaml
# Step 2: helm upgrade --install ...  (not a yaml file in lab-final)
kubectl apply -f networking/edge-nodeport.yaml
kubectl apply -f config/
kubectl apply -f apps/
kubectl apply -f networking/ingress.yaml
# admin-auth secret before or with ingress
```

---

## Names for interactive Check

| Kind | Name |
|---|---|
| ConfigMap | `app-config` (`index.html`) |
| Secret | `app-secret` (`password`) |
| Deployment | `web`, `api`, `admin` |
| Service | `web`, `api`, `admin`, `edge` |
| Ingress | `shop` |

---

## Success criteria

- [ ] Stand: `--nodes 2 --no-addons --lb`; first hit → **502**
- [ ] Ingress Controller on **nodePort 32080**; LB URL → not 502
- [ ] ConfigMap HTML + Secret password as specified
- [ ] Three **nginx** Deployments Ready; each has **liveness + readiness** probes and **requests/limits**
- [ ] ClusterIP Services; NodePort `edge`
- [ ] Ingress `shop` routes `/`, `/api`, `/admin`; `/admin` asks for password
- [ ] Interactive **Check** passes

## Cleanup

```bash
kubectl delete namespace lab-final
mockctl down
```

## Self-check questions

1. Who answers **502** — the edge LB or a Pod in the cluster?  
2. Why must the Ingress Controller use **nodePort 32080** in this lab?  
3. Why put HTML in a ConfigMap but the admin password in a Secret?  
4. Who shows the browser password popup — the admin Pod or the Ingress Controller?  
5. What is the difference between **livenessProbe** and **readinessProbe** on your Deployments?

## Next

[`kuber-intermediate`](../kuber-intermediate/README.md) — StatefulSet, Helm, RBAC, HPA, blue-green.
