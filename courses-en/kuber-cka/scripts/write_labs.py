#!/usr/bin/env python3
"""Generate lab YAML, lesson markdown, and mockctl lab.json sidecars."""

from __future__ import annotations

import json
from pathlib import Path
from textwrap import dedent

import yaml

ROOT = Path(__file__).resolve().parents[1]
LABS = ROOT / "labs"
LABS.mkdir(exist_ok=True)

HEALTHY = [
    {"type": "api_reachable", "desc": "Kubernetes API reachable"},
    {"type": "nodes_ready", "min": 3, "desc": "all required nodes Ready"},
    {"type": "coredns_healthy", "desc": "CoreDNS healthy"},
    {"type": "cni_healthy", "desc": "CNI healthy"},
]


def dump(path: Path, data: dict) -> None:
    path.write_text(
        yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )


def lesson(md_name: str, title: str, body: str, lab_id: str) -> None:
    (ROOT / md_name).write_text(body.strip() + "\n", encoding="utf-8")
    sidecar = {
        "id": f"kuber-cka/{Path(md_name).stem}",
        "title": title,
        "backend": "labctl",
        "labId": lab_id,
        "setup": [],
        "checks": [],
        "cleanup": [],
    }
    (ROOT / md_name.replace(".md", ".lab.json")).write_text(
        json.dumps(sidecar, indent=2) + "\n", encoding="utf-8"
    )


def cka_page(num: str, name: str, title: str, task: str) -> str:
    return dedent(
        f"""
        # CKA {num} — {title}

        **Start** the lab, then complete the task. There is no walkthrough.

        ## Task

        {task.strip()}

        **Check** grades the resulting cluster state — not the commands you typed.
        **Cleanup** when you are done or before the next lab.
        """
    )


def oncall_page(num: str, priority: str, title: str, body: str) -> str:
    return (
        f"# ON-CALL {num}\n\n"
        "**Start** seeds the incident. Restore service. Do not skip ahead.\n\n"
        "## Ticket\n\n"
        f"{priority}\n\n"
        f"**{title}**\n\n"
        f"{body.strip()}\n"
    )


LAB_DEFS: list[dict] = []
MD: list[tuple[str, str, str, str]] = []


def add(lab: dict, md_file: str, md_title: str, md_body: str) -> None:
    LAB_DEFS.append(lab)
    MD.append((md_file, md_title, md_body, lab["id"]))


# ---------- bootstrap ----------
add(
    {
        "id": "bootstrap-01-nodes",
        "title": "Bootstrap 01 — Linux nodes",
        "track": "bootstrap",
        "prerequisites": [],
        "setup": [],
        "initial_state": [],
        "task": "Three Linux nodes exist and accept SSH.",
        "verify": [
            {"type": "ssh_reachable", "nodes": ["node-01", "node-02", "node-03"], "desc": "node-01..03 reachable", "points": 10},
        ],
        "cleanup": [],
    },
    "11-lab-nodes.md",
    "Bootstrap 01 — Linux nodes",
    Path(ROOT / "11-lab-nodes.md").read_text(encoding="utf-8") if (ROOT / "11-lab-nodes.md").exists() else "",
)

# bootstrap md already written — only emit yaml + sidecar for those
BOOTSTRAP_MD = {
    "bootstrap-01-nodes": ("11-lab-nodes.md", "Bootstrap 01 — Linux nodes"),
    "bootstrap-02-inventory": ("12-lab-inventory.md", "Bootstrap 02 — Kubespray inventory"),
    "bootstrap-03-deploy": ("13-lab-deploy.md", "Bootstrap 03 — Deploy Kubernetes"),
    "bootstrap-04-control-plane": ("14-lab-control-plane.md", "Bootstrap 04 — Control plane"),
    "bootstrap-05-etcd": ("15-lab-etcd.md", "Bootstrap 05 — etcd"),
    "bootstrap-06-cni": ("16-lab-cni.md", "Bootstrap 06 — CNI"),
    "bootstrap-07-coredns": ("17-lab-coredns.md", "Bootstrap 07 — CoreDNS"),
    "bootstrap-08-app": ("18-lab-app.md", "Bootstrap 08 — Shop app"),
    "bootstrap-09-ingress": ("19-lab-ingress.md", "Bootstrap 09 — Ingress"),
}

# reset add() list — we will rebuild cleanly
LAB_DEFS.clear()
MD.clear()

bootstrap = [
    (
        "bootstrap-01-nodes",
        "Bootstrap 01 — Linux nodes",
        [],
        [{"type": "ssh_reachable", "nodes": ["node-01", "node-02", "node-03"], "desc": "three nodes reachable over SSH", "points": 10}],
        [],
    ),
    (
        "bootstrap-02-inventory",
        "Bootstrap 02 — Kubespray inventory",
        [],
        [
            {"type": "dir_exists", "path": "~/kuber-cka/kubespray/inventory/lab", "desc": "inventory/lab exists", "points": 5},
            {"type": "ssh_reachable", "nodes": ["node-01", "node-02", "node-03"], "desc": "Ansible hosts reachable", "points": 5},
        ],
        [],
    ),
    (
        "bootstrap-03-deploy",
        "Bootstrap 03 — Deploy Kubernetes",
        [],
        [
            {"type": "api_reachable", "desc": "Kubernetes API reachable", "points": 6},
            {"type": "node_count", "min": 3, "desc": "three nodes registered", "points": 4},
        ],
        [],
    ),
    (
        "bootstrap-04-control-plane",
        "Bootstrap 04 — Control plane",
        [{"type": "api_reachable", "desc": "API reachable"}],
        [
            {"type": "control_plane_healthy", "desc": "apiserver, controller-manager, scheduler Running", "points": 7},
            {"type": "api_reachable", "desc": "API readyz", "points": 3},
        ],
        [],
    ),
    (
        "bootstrap-05-etcd",
        "Bootstrap 05 — etcd",
        [{"type": "api_reachable", "desc": "API reachable"}],
        [{"type": "etcd_healthy", "desc": "etcd Pod Running", "points": 10}],
        [],
    ),
    (
        "bootstrap-06-cni",
        "Bootstrap 06 — CNI",
        [{"type": "api_reachable", "desc": "API reachable"}],
        [
            {"type": "cni_healthy", "desc": "CNI healthy", "points": 5},
            {"type": "nodes_ready", "min": 3, "desc": "three Ready nodes", "points": 5},
        ],
        [],
    ),
    (
        "bootstrap-07-coredns",
        "Bootstrap 07 — CoreDNS",
        [{"type": "nodes_ready", "min": 3, "desc": "nodes Ready"}],
        [
            {"type": "coredns_healthy", "desc": "CoreDNS Ready", "points": 5},
            {"type": "dns_resolves", "name": "kubernetes.default.svc.cluster.local", "namespace": "default", "desc": "cluster DNS resolves kubernetes.default", "points": 5},
        ],
        [],
    ),
    (
        "bootstrap-08-app",
        "Bootstrap 08 — Shop app",
        HEALTHY,
        [
            {"type": "deployment_ready", "name": "frontend", "namespace": "shop", "value": "2", "desc": "frontend Ready", "points": 4},
            {"type": "deployment_ready", "name": "backend", "namespace": "shop", "value": "2", "desc": "backend Ready", "points": 3},
            {"type": "deployment_ready", "name": "redis", "namespace": "shop", "value": "1", "desc": "redis Ready", "points": 3},
        ],
        [],
    ),
    (
        "bootstrap-09-ingress",
        "Bootstrap 09 — Ingress",
        HEALTHY,
        [
            {"type": "exists", "kind": "ingress", "name": "shop", "namespace": "shop", "desc": "Ingress shop exists", "points": 4},
            {"type": "ingress_host", "name": "shop", "namespace": "shop", "host": "app.example.com", "desc": "host app.example.com", "points": 3},
            {"type": "ingress_backend", "name": "shop", "namespace": "shop", "value": "frontend", "desc": "backend frontend", "points": 3},
        ],
        [],
    ),
]

for bid, title, pre, ver, cln in bootstrap:
    LAB_DEFS.append(
        {
            "id": bid,
            "title": title,
            "track": "bootstrap",
            "prerequisites": pre,
            "setup": [],
            "initial_state": [],
            "task": title,
            "verify": ver,
            "cleanup": cln,
        }
    )
    md_file, md_title = BOOTSTRAP_MD[bid]
    MD.append((md_file, md_title, None, bid))  # keep existing md


# ---------- CKA 01-11 ----------
add(
    {
        "id": "cka-01-pod",
        "title": "Create a Pod",
        "track": "cka",
        "namespace": "cka-01",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-01"},
            {"op": "ensure_namespace", "name": "cka-01"},
        ],
        "initial_state": [
            {"type": "namespace_exists", "name": "cka-01", "desc": "Namespace cka-01 exists"},
            {"type": "absent", "kind": "pod", "name": "nginx", "namespace": "cka-01", "desc": "Pod nginx is not present yet"},
        ],
        "task": dedent(
            """
            Create a Pod named nginx in namespace cka-01.

            Requirements:
            - image: nginx:1.27
            - container port: 80
            - requests: cpu 50m, memory 64Mi
            - limits: cpu 200m, memory 128Mi

            The Pod must become Running.
            """
        ),
        "hints": ["A single Pod object is enough — Deployment is optional.", "Check requests and limits on the container, not the node."],
        "explanation": "The grader looks at the Pod spec and phase. kubectl run or a YAML apply both work.",
        "verify": [
            {"type": "exists", "kind": "pod", "name": "nginx", "namespace": "cka-01", "desc": "Pod nginx exists", "points": 1},
            {"type": "pod_running", "name": "nginx", "namespace": "cka-01", "desc": "Pod is Running", "points": 2},
            {"type": "pod_image", "name": "nginx", "namespace": "cka-01", "value": "nginx:1.27", "desc": "Image nginx:1.27", "points": 2},
            {"type": "pod_port", "name": "nginx", "namespace": "cka-01", "port": 80, "desc": "containerPort 80", "points": 1},
            {"type": "pod_resources", "name": "nginx", "namespace": "cka-01", "request_cpu": "50m", "request_memory": "64Mi", "limit_cpu": "200m", "limit_memory": "128Mi", "desc": "requests and limits match", "points": 4},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-01"}],
    },
    "21-lab-cka-01-pod.md",
    "CKA 01 — Create a Pod",
    cka_page("01", "pod", "Create a Pod", """
        Create a Pod named `nginx` in namespace `cka-01`.

        Requirements:

        - image: `nginx:1.27`
        - container port: `80`
        - requests: cpu `50m`, memory `64Mi`
        - limits: cpu `200m`, memory `128Mi`

        The Pod must become Running.
    """),
)

add(
    {
        "id": "cka-02-deployment",
        "title": "Deployment",
        "track": "cka",
        "namespace": "cka-02",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-02"},
            {"op": "ensure_namespace", "name": "cka-02"},
        ],
        "initial_state": [{"type": "namespace_exists", "name": "cka-02", "desc": "Namespace cka-02 exists"}],
        "task": "Create Deployment frontend in cka-02 with 3 replicas, image nginx:1.27. Rollout must complete.",
        "verify": [
            {"type": "exists", "kind": "deployment", "name": "frontend", "namespace": "cka-02", "desc": "Deployment frontend exists", "points": 2},
            {"type": "replicas", "kind": "deployment", "name": "frontend", "namespace": "cka-02", "value": "3", "desc": "3 replicas", "points": 3},
            {"type": "image", "kind": "deployment", "name": "frontend", "namespace": "cka-02", "value": "nginx:1.27", "desc": "image nginx:1.27", "points": 2},
            {"type": "rollout_complete", "name": "frontend", "namespace": "cka-02", "desc": "rollout complete", "points": 3},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-02"}],
    },
    "22-lab-cka-02-deployment.md",
    "CKA 02 — Deployment",
    cka_page("02", "deploy", "Deployment", """
        Create a Deployment named `frontend` in namespace `cka-02`.

        - image: `nginx:1.27`
        - replicas: `3`

        The rollout must complete. All replicas Ready.
    """),
)

add(
    {
        "id": "cka-03-rollout",
        "title": "Rolling update",
        "track": "cka",
        "namespace": "cka-03",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-03"},
            {"op": "ensure_namespace", "name": "cka-03"},
            {"op": "kubectl", "args": ["-n", "cka-03", "create", "deployment", "frontend", "--image=nginx:1.26", "--replicas=3"]},
            {"op": "wait", "kind": "deployment", "name": "frontend", "namespace": "cka-03"},
        ],
        "initial_state": [
            {"type": "deployment_ready", "name": "frontend", "namespace": "cka-03", "value": "3", "desc": "frontend is healthy before the update"},
        ],
        "task": "Update Deployment frontend in cka-03 to image nginx:1.27. Keep 3 replicas. Rollout complete. At least two ReplicaSets must exist (history).",
        "verify": [
            {"type": "image", "kind": "deployment", "name": "frontend", "namespace": "cka-03", "value": "nginx:1.27", "desc": "image nginx:1.27", "points": 3},
            {"type": "replicas", "name": "frontend", "namespace": "cka-03", "value": "3", "desc": "3 replicas", "points": 2},
            {"type": "rollout_complete", "name": "frontend", "namespace": "cka-03", "desc": "rollout complete", "points": 3},
            {"type": "replicaset_min", "name": "frontend", "namespace": "cka-03", "min": 2, "desc": "rollout history (ReplicaSets)", "points": 2},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-03"}],
    },
    "23-lab-cka-03-rollout.md",
    "CKA 03 — Rolling update",
    cka_page("03", "rollout", "Rolling update", """
        Namespace `cka-03` already has Deployment `frontend` on `nginx:1.26`.

        Update the image to `nginx:1.27`. Keep 3 replicas. The rollout must complete.
        Rollout history must remain (do not delete old ReplicaSets).
    """),
)

add(
    {
        "id": "cka-04-scheduling",
        "title": "Scheduling",
        "track": "cka",
        "namespace": "cka-04",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-04"},
            {"op": "ensure_namespace", "name": "cka-04"},
            {"op": "label_node", "node": "worker-1", "key": "disk", "value": "ssd"},
        ],
        "initial_state": [
            {"type": "namespace_exists", "name": "cka-04", "desc": "Namespace ready"},
        ],
        "task": "Create Pod web in cka-04 that must run only on the node labeled disk=ssd. Image nginx:1.27. Pod Running on that node.",
        "verify": [
            {"type": "pod_running", "name": "web", "namespace": "cka-04", "desc": "Pod web Running", "points": 4},
            {"type": "pod_on_node", "name": "web", "namespace": "cka-04", "labels": {"disk": "ssd"}, "desc": "scheduled on disk=ssd", "points": 6},
        ],
        "cleanup": [
            {"op": "delete_namespace", "name": "cka-04"},
            {"op": "unlabel_node", "node": "worker-1", "key": "disk"},
        ],
        "explanation": "nodeSelector or nodeAffinity both pass if the Pod lands on the labeled node.",
    },
    "24-lab-cka-04-scheduling.md",
    "CKA 04 — Scheduling",
    cka_page("04", "sched", "Scheduling", """
        Nodes have been labeled for this lab. Create a workload named `web` in namespace `cka-04`
        that must run **only** on the node labeled `disk=ssd`.

        Image: `nginx:1.27`. The Pod must be Running on that node.
    """),
)

add(
    {
        "id": "cka-05-taints",
        "title": "Taints / tolerations",
        "track": "cka",
        "namespace": "cka-05",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-05"},
            {"op": "ensure_namespace", "name": "cka-05"},
            {"op": "taint_node", "node": "worker-2", "key": "cka-lab", "value": "true", "effect": "NoSchedule"},
        ],
        "initial_state": [
            {"type": "node_has_taint", "node": "worker-2", "key": "cka-lab", "value": "true", "desc": "a worker carries the lab taint"},
        ],
        "task": "Create Pod tainted-ok in cka-05 with image nginx:1.27 that runs on the tainted worker (toleration required). Pod Running on that node.",
        "verify": [
            {"type": "pod_running", "name": "tainted-ok", "namespace": "cka-05", "desc": "Pod Running", "points": 4},
            {"type": "pod_has_toleration", "name": "tainted-ok", "namespace": "cka-05", "key": "cka-lab", "desc": "toleration present", "points": 3},
            {"type": "pod_on_node", "name": "tainted-ok", "namespace": "cka-05", "node": "worker-2", "desc": "on the tainted worker", "points": 3},
        ],
        "cleanup": [
            {"op": "delete_namespace", "name": "cka-05"},
            {"op": "untaint_node", "node": "worker-2", "key": "cka-lab", "value": "true", "effect": "NoSchedule"},
        ],
    },
    "25-lab-cka-05-taints.md",
    "CKA 05 — Taints / tolerations",
    cka_page("05", "taint", "Taints / tolerations", """
        A worker node has a taint for this lab.

        Create a Pod named `tainted-ok` in namespace `cka-05` (image `nginx:1.27`)
        that runs **on that tainted worker**. You must use a correct toleration.

        Do not remove the taint.
    """),
)

add(
    {
        "id": "cka-06-service",
        "title": "Service",
        "track": "cka",
        "namespace": "cka-06",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-06"},
            {"op": "ensure_namespace", "name": "cka-06"},
            {"op": "kubectl", "args": ["-n", "cka-06", "create", "deployment", "backend", "--image=nginx:1.27", "--replicas=2"]},
            {"op": "kubectl", "args": ["-n", "cka-06", "label", "deploy", "backend", "app=backend", "--overwrite"]},
            {"op": "wait", "kind": "deployment", "name": "backend", "namespace": "cka-06"},
        ],
        "initial_state": [
            {"type": "deployment_ready", "name": "backend", "namespace": "cka-06", "desc": "backend Deployment is healthy"},
        ],
        "task": "Create ClusterIP Service backend-svc in cka-06 selecting app=backend, port 80, targetPort 80. EndpointSlice populated. Service reachable.",
        "verify": [
            {"type": "exists", "kind": "service", "name": "backend-svc", "namespace": "cka-06", "desc": "Service exists", "points": 1},
            {"type": "service_type", "name": "backend-svc", "namespace": "cka-06", "value": "ClusterIP", "desc": "type ClusterIP", "points": 1},
            {"type": "selector", "name": "backend-svc", "namespace": "cka-06", "key": "app", "value": "backend", "desc": "selector app=backend", "points": 2},
            {"type": "service_port", "name": "backend-svc", "namespace": "cka-06", "port": 80, "target_port": 80, "desc": "port 80 → 80", "points": 2},
            {"type": "endpoints", "name": "backend-svc", "namespace": "cka-06", "min": 1, "desc": "EndpointSlice populated", "points": 2},
            {"type": "http_get", "namespace": "cka-06", "url": "http://backend-svc.cka-06.svc.cluster.local", "desc": "Service reachable from a test Pod", "points": 2},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-06"}],
    },
    "26-lab-cka-06-service.md",
    "CKA 06 — Service",
    cka_page("06", "svc", "Service", """
        Namespace `cka-06` has a healthy backend Deployment (labels include `app=backend`).

        Create a ClusterIP Service named `backend-svc`:

        - selector: `app=backend`
        - port: `80`
        - targetPort: `80`

        EndpointSlices must be populated. The Service must be reachable from another Pod in the cluster.
    """),
)

add(
    {
        "id": "cka-07-ingress",
        "title": "Ingress",
        "track": "cka",
        "namespace": "cka-07",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-07"},
            {"op": "ensure_namespace", "name": "cka-07"},
            {"op": "kubectl", "args": ["-n", "cka-07", "create", "deployment", "frontend", "--image=nginx:1.27", "--replicas=1"]},
            {"op": "kubectl", "args": ["-n", "cka-07", "label", "deploy", "frontend", "app=frontend", "--overwrite"]},
            {"op": "kubectl", "args": ["-n", "cka-07", "expose", "deploy", "frontend", "--port=80", "--target-port=80", "--name=frontend"]},
            {"op": "wait", "kind": "deployment", "name": "frontend", "namespace": "cka-07"},
        ],
        "initial_state": [
            {"type": "exists", "kind": "service", "name": "frontend", "namespace": "cka-07", "desc": "frontend Service exists"},
        ],
        "task": "Create Ingress app in cka-07: host app.example.com → Service frontend:80.",
        "verify": [
            {"type": "exists", "kind": "ingress", "name": "app", "namespace": "cka-07", "desc": "Ingress app exists", "points": 3},
            {"type": "ingress_host", "name": "app", "namespace": "cka-07", "host": "app.example.com", "desc": "host app.example.com", "points": 4},
            {"type": "ingress_backend", "name": "app", "namespace": "cka-07", "value": "frontend", "desc": "backend frontend", "points": 3},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-07"}],
    },
    "27-lab-cka-07-ingress.md",
    "CKA 07 — Ingress",
    cka_page("07", "ing", "Ingress", """
        Namespace `cka-07` has Deployment and Service `frontend`.

        Configure HTTP routing:

        ```text
        app.example.com
                ↓
        frontend
        ```

        Create Ingress `app` in `cka-07`. Use the IngressClass your controller expects.
    """),
)

add(
    {
        "id": "cka-08-networkpolicy",
        "title": "NetworkPolicy",
        "track": "cka",
        "namespace": "cka-08",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-08"},
            {"op": "ensure_namespace", "name": "cka-08"},
        ],
        "initial_state": [{"type": "namespace_exists", "name": "cka-08", "desc": "Namespace cka-08 exists"}],
        "task": "In cka-08 create frontend, backend, redis (labels app=frontend|backend|redis) and NetworkPolicies: frontend→backend ALLOW, backend→redis ALLOW, frontend→redis DENY. Default deny other ingress in the namespace is acceptable.",
        "verify": [
            {"type": "exists", "kind": "networkpolicy", "name": "allow-frontend-to-backend", "namespace": "cka-08", "desc": "policy frontend→backend", "points": 4},
            {"type": "exists", "kind": "networkpolicy", "name": "allow-backend-to-redis", "namespace": "cka-08", "desc": "policy backend→redis", "points": 3},
            {"type": "exists", "kind": "networkpolicy", "name": "deny-frontend-to-redis", "namespace": "cka-08", "desc": "policy frontend↛redis (or equivalent default-deny)", "points": 3},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-08"}],
        "explanation": "Names can differ if you used one default-deny plus two allow policies — then rename or add the expected objects. The listed names are the contract for this lab.",
    },
    "28-lab-cka-08-networkpolicy.md",
    "CKA 08 — NetworkPolicy",
    cka_page("08", "np", "NetworkPolicy", """
        In namespace `cka-08` implement:

        ```text
        frontend → backend = ALLOW
        backend → redis    = ALLOW
        frontend → redis   = DENY
        ```

        Create Pods or Deployments labeled `app=frontend`, `app=backend`, `app=redis`
        (nginx / redis images are fine).

        NetworkPolicies must be named:

        - `allow-frontend-to-backend`
        - `allow-backend-to-redis`
        - `deny-frontend-to-redis`

        (A default-deny plus two allow policies is fine if those three names exist —
        the deny object may be a default-deny that excludes redis from frontend.)
    """),
)

add(
    {
        "id": "cka-09-configmap",
        "title": "ConfigMap",
        "track": "cka",
        "namespace": "cka-09",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-09"},
            {"op": "ensure_namespace", "name": "cka-09"},
        ],
        "initial_state": [{"type": "namespace_exists", "name": "cka-09", "desc": "Namespace ready"}],
        "task": "Create ConfigMap app-config in cka-09 with COLOR=blue. Deployment web (nginx:1.27) must consume it.",
        "verify": [
            {"type": "exists", "kind": "configmap", "name": "app-config", "namespace": "cka-09", "desc": "ConfigMap exists", "points": 3},
            {"type": "has_key", "kind": "configmap", "name": "app-config", "namespace": "cka-09", "key": "COLOR", "value": "blue", "desc": "COLOR=blue", "points": 3},
            {"type": "env_from_configmap", "kind": "deployment", "name": "web", "namespace": "cka-09", "value": "app-config", "desc": "Deployment web uses the ConfigMap", "points": 4},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-09"}],
    },
    "29-lab-cka-09-configmap.md",
    "CKA 09 — ConfigMap",
    cka_page("09", "cm", "ConfigMap", """
        In namespace `cka-09`:

        - Create ConfigMap `app-config` with key `COLOR=blue`.
        - Create Deployment `web` (`nginx:1.27`) that uses that ConfigMap
          (env, envFrom, or a mounted file — any correct use).
    """),
)

add(
    {
        "id": "cka-10-secret",
        "title": "Secret",
        "track": "cka",
        "namespace": "cka-10",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-10"},
            {"op": "ensure_namespace", "name": "cka-10"},
        ],
        "initial_state": [{"type": "namespace_exists", "name": "cka-10", "desc": "Namespace ready"}],
        "task": "Create Secret db-pass in cka-10 with password=s3cret. Pod app must use it.",
        "verify": [
            {"type": "exists", "kind": "secret", "name": "db-pass", "namespace": "cka-10", "desc": "Secret exists", "points": 3},
            {"type": "env_from_secret", "kind": "pod", "name": "app", "namespace": "cka-10", "value": "db-pass", "desc": "Pod app uses the Secret", "points": 4},
            {"type": "pod_running", "name": "app", "namespace": "cka-10", "desc": "Pod app Running", "points": 3},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-10"}],
    },
    "30-lab-cka-10-secret.md",
    "CKA 10 — Secret",
    cka_page("10", "sec", "Secret", """
        In namespace `cka-10`:

        - Create Secret `db-pass` with key `password=s3cret`.
        - Create Pod `app` (image `nginx:1.27`) that uses that Secret
          (env or volume). The Pod must be Running.
    """),
)

add(
    {
        "id": "cka-11-pvc",
        "title": "PVC",
        "track": "cka",
        "namespace": "cka-11",
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "cka-11"},
            {"op": "ensure_namespace", "name": "cka-11"},
        ],
        "initial_state": [{"type": "namespace_exists", "name": "cka-11", "desc": "Namespace ready"}],
        "task": "Create PVC data 1Gi ReadWriteOnce. Mount it on Pod keeper (nginx:1.27) at /data. PVC Bound, Pod Running.",
        "verify": [
            {"type": "exists", "kind": "pvc", "name": "data", "namespace": "cka-11", "desc": "PVC data exists", "points": 2},
            {"type": "pvc_size", "name": "data", "namespace": "cka-11", "value": "1Gi", "desc": "1Gi", "points": 2},
            {"type": "pvc_access_mode", "name": "data", "namespace": "cka-11", "value": "ReadWriteOnce", "desc": "ReadWriteOnce", "points": 2},
            {"type": "pvc_bound", "name": "data", "namespace": "cka-11", "desc": "PVC Bound", "points": 2},
            {"type": "volume_mounted", "kind": "pod", "name": "keeper", "namespace": "cka-11", "value": "data", "desc": "mounted in Pod keeper", "points": 1},
            {"type": "pod_running", "name": "keeper", "namespace": "cka-11", "desc": "Pod Running", "points": 1},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "cka-11"}],
    },
    "31-lab-cka-11-pvc.md",
    "CKA 11 — PVC",
    cka_page("11", "pvc", "PVC", """
        In namespace `cka-11`:

        - Create PVC `data`: `1Gi`, `ReadWriteOnce`.
        - Create Pod `keeper` (`nginx:1.27`) that mounts it at `/data`.

        The PVC must be Bound. The Pod must be Running.

        Persistence: after you write a file under `/data`, it must survive a Pod delete/recreate
        using the same PVC (the grader checks the mount, not the file contents).
    """),
)


# ---------- troubleshooting 12-25 ----------
def tshoot(lab_id, title, ns, setup, initial, task, verify, cleanup, md_file, num, page_task, root_cause=""):
    add(
        {
            "id": lab_id,
            "title": title,
            "track": "troubleshooting",
            "namespace": ns,
            "prerequisites": [{"type": "api_reachable", "desc": "Kubernetes API reachable"}] + (
                HEALTHY[1:] if lab_id not in {"cka-13-notready", "cka-15-dns", "cka-18-apiserver", "cka-19-etcd", "cka-21-diskpressure", "cka-24-cni", "cka-25-coredns"} else []
            ),
            "setup": setup,
            "initial_state": initial,
            "task": task,
            "root_cause": root_cause,
            "hide_root_cause": True,
            "verify": verify,
            "cleanup": cleanup,
        },
        md_file,
        title,
        cka_page(num, lab_id, title.split("—")[-1].strip(), page_task),
    )


tshoot(
    "cka-12-pending",
    "CKA 12 — Pod Pending",
    "cka-12",
    [
        {"op": "delete_namespace", "name": "cka-12"},
        {"op": "ensure_namespace", "name": "cka-12"},
        {"op": "apply", "file": "manifests/pending-nodeselector.yaml"},
    ],
    [
        {"type": "pod_pending", "name": "checkout", "namespace": "cka-12", "desc": "workload checkout is Pending"},
    ],
    "Pod checkout in cka-12 is Pending. Find why and make it Running. Do not delete the Pod and replace it with an unrelated app.",
    [
        {"type": "exists", "kind": "pod", "name": "checkout", "namespace": "cka-12", "desc": "Pod checkout still exists", "points": 2},
        {"type": "pod_running", "name": "checkout", "namespace": "cka-12", "desc": "Pod is Running", "points": 8},
    ],
    [{"op": "delete_namespace", "name": "cka-12"}],
    "41-lab-cka-12-pending.md",
    "12",
    """
        A Pod named `checkout` in namespace `cka-12` is stuck in **Pending**.

        Identify the problem and make the Pod Running.

        Do not replace it with a different application. You may edit the Pod or the cluster
        so that this workload schedules.
    """,
    root_cause="The Pod has a nodeSelector that matches no node.",
)

tshoot(
    "cka-13-notready",
    "CKA 13 — Node NotReady",
    "cka-13",
    [
        {"op": "stop_service", "node": "worker-1", "service": "kubelet"},
        {"op": "sleep", "value": "8"},
    ],
    [
        {"type": "node_not_ready", "node": "worker-1", "desc": "one worker is not Ready"},
    ],
    "One node is NotReady. Diagnose from kubectl through kubelet/containerd/logs. Restore Ready.",
    [
        {"type": "nodes_ready", "min": 3, "desc": "all required nodes Ready", "points": 10},
    ],
    [
        {"op": "start_service", "node": "worker-1", "service": "kubelet"},
        {"op": "start_service", "node": "worker-1", "service": "containerd"},
    ],
    "42-lab-cka-13-notready.md",
    "13",
    """
        One Kubernetes node is **NotReady**.

        Diagnose it yourself (`kubectl` → node conditions → kubelet → containerd → system logs).
        Restore cluster health so every required node is Ready.

        Setup really broke the node. Cleanup will try to undo leftover damage — still fix it yourself for the score.
    """,
    root_cause="kubelet was stopped on a worker.",
)

tshoot(
    "cka-14-service",
    "CKA 14 — Broken Service",
    "cka-14",
    [
        {"op": "delete_namespace", "name": "cka-14"},
        {"op": "ensure_namespace", "name": "cka-14"},
        {"op": "apply", "file": "manifests/broken-service.yaml"},
        {"op": "wait", "kind": "deployment", "name": "backend", "namespace": "cka-14"},
    ],
    [
        {"type": "deployment_ready", "name": "backend", "namespace": "cka-14", "desc": "backend Pods are healthy"},
        {"type": "exists", "kind": "service", "name": "backend-svc", "namespace": "cka-14", "desc": "Service backend-svc exists"},
    ],
    "backend-svc in cka-14 is not reachable from other Pods. Pods look fine. Do not modify the backend Deployment. Restore connectivity.",
    [
        {"type": "selector", "name": "backend-svc", "namespace": "cka-14", "key": "app", "value": "backend", "desc": "selector matches Pods", "points": 3},
        {"type": "service_port", "name": "backend-svc", "namespace": "cka-14", "port": 80, "target_port": 80, "desc": "port/targetPort", "points": 3},
        {"type": "endpoints", "name": "backend-svc", "namespace": "cka-14", "min": 1, "desc": "EndpointSlice populated", "points": 2},
        {"type": "http_get", "namespace": "cka-14", "url": "http://backend-svc.cka-14.svc.cluster.local", "desc": "Service reachable", "points": 2},
    ],
    [{"op": "delete_namespace", "name": "cka-14"}],
    "43-lab-cka-14-service.md",
    "14",
    """
        A Service named `backend-svc` in namespace `cka-14` is not reachable from other Pods.

        Backend Pods appear healthy. The Service object exists.

        Identify the problem and restore connectivity.

        **Do not modify the application Deployment.**
    """,
    root_cause="Wrong Service selector and targetPort.",
)

tshoot(
    "cka-15-dns",
    "CKA 15 — Broken DNS",
    "cka-15",
    [
        {"op": "backup_configmap", "name": "coredns", "namespace": "kube-system"},
        {"op": "apply", "file": "manifests/broken-coredns.yaml"},
        {"op": "sleep", "value": "5"},
    ],
    [
        {"type": "api_reachable", "desc": "API still reachable"},
    ],
    "Pods cannot resolve Kubernetes Service names. Diagnose resolv.conf, kube-dns Service, CoreDNS Pods and config. Restore DNS.",
    [
        {"type": "coredns_healthy", "desc": "CoreDNS healthy", "points": 4},
        {"type": "dns_resolves", "name": "kubernetes.default.svc.cluster.local", "namespace": "default", "desc": "kubernetes.default resolves", "points": 6},
    ],
    [
        {"op": "apply", "file": "manifests/coredns-good.yaml"},
        {"op": "kubectl", "args": ["-n", "kube-system", "rollout", "restart", "deploy/coredns"]},
    ],
    "44-lab-cka-15-dns.md",
    "15",
    """
        Pods cannot resolve Kubernetes Service names.

        Diagnose `/etc/resolv.conf`, the CoreDNS Service, CoreDNS Pods, and CoreDNS configuration.
        Restore cluster DNS.

        Do not install a second DNS server as a workaround.
    """,
    root_cause="CoreDNS Corefile was replaced with a broken forwarder.",
)

tshoot(
    "cka-16-egress",
    "CKA 16 — No Internet egress",
    "cka-16",
    [
        {"op": "set_sysctl", "node": "worker-1", "key": "net.ipv4.ip_forward", "value": "0"},
        {"op": "set_sysctl", "node": "worker-2", "key": "net.ipv4.ip_forward", "value": "0"},
    ],
    [
        {"type": "coredns_healthy", "desc": "CoreDNS still healthy"},
    ],
    "DNS may work. curl https://example.com from a Pod does not. Diagnose Pod → node → routing → forwarding → NAT → firewall. Restore egress.",
    [
        {"type": "sysctl", "node": "worker-1", "key": "net.ipv4.ip_forward", "value": "1", "desc": "ip_forward on worker-1", "points": 5},
        {"type": "sysctl", "node": "worker-2", "key": "net.ipv4.ip_forward", "value": "1", "desc": "ip_forward on worker-2", "points": 5},
    ],
    [
        {"op": "set_sysctl", "node": "worker-1", "key": "net.ipv4.ip_forward", "value": "1"},
        {"op": "set_sysctl", "node": "worker-2", "key": "net.ipv4.ip_forward", "value": "1"},
    ],
    "45-lab-cka-16-egress.md",
    "16",
    """
        DNS may work. From a Pod, `curl https://example.com` does not.

        Diagnose Pod → node → routing → forwarding → NAT → firewall.
        Restore Internet egress for application Pods.
    """,
    root_cause="ip_forward was disabled on workers.",
)

tshoot(
    "cka-17-ingress",
    "CKA 17 — Ingress broken",
    "cka-17",
    [
        {"op": "delete_namespace", "name": "cka-17"},
        {"op": "ensure_namespace", "name": "cka-17"},
        {"op": "kubectl", "args": ["-n", "cka-17", "create", "deployment", "frontend", "--image=nginx:1.27"]},
        {"op": "kubectl", "args": ["-n", "cka-17", "expose", "deploy", "frontend", "--port=80", "--name=frontend"]},
        {"op": "kubectl", "args": ["-n", "cka-17", "create", "ing", "app", "--rule=app.example.com/=frontend:80", "--class=nginx"]},
        {"op": "kubectl", "args": ["-n", "cka-17", "patch", "svc", "frontend", "-p", '{"spec":{"selector":{"app":"nope"}}}']},
    ],
    [
        {"type": "exists", "kind": "ingress", "name": "app", "namespace": "cka-17", "desc": "Ingress exists"},
        {"type": "exists", "kind": "service", "name": "frontend", "namespace": "cka-17", "desc": "Service exists"},
    ],
    "Ingress app.example.com in cka-17 stopped working. Find whether the fault is Ingress, Service, endpoints, controller, node, or network.",
    [
        {"type": "selector", "name": "frontend", "namespace": "cka-17", "key": "app", "value": "frontend", "desc": "Service selector matches", "points": 4},
        {"type": "endpoints", "name": "frontend", "namespace": "cka-17", "min": 1, "desc": "endpoints populated", "points": 3},
        {"type": "ingress_backend", "name": "app", "namespace": "cka-17", "value": "frontend", "desc": "Ingress still points at frontend", "points": 3},
    ],
    [{"op": "delete_namespace", "name": "cka-17"}],
    "46-lab-cka-17-ingress.md",
    "17",
    """
        Ingress for `app.example.com` in namespace `cka-17` stopped working.

        Determine where the problem is: Ingress, Service, Endpoint, Ingress controller, node, or network.
        Restore HTTP routing to frontend.
    """,
    root_cause="frontend Service selector no longer matches Pods.",
)

tshoot(
    "cka-18-apiserver",
    "CKA 18 — API Server timeout",
    "cka-18",
    [
        {"op": "tc_delay", "node": "control-plane", "value": "2800ms"},
    ],
    [
        {"type": "api_reachable", "desc": "API still answers (slowly)"},
    ],
    "kubectl is timing out or extremely slow. Diagnose API endpoint, kube-apiserver, etcd. Remove the degradation.",
    [
        {"type": "control_plane_healthy", "desc": "control plane Running", "points": 5},
        {"type": "api_reachable", "desc": "API reachable without the injected delay", "points": 5},
    ],
    [{"op": "tc_clear", "node": "control-plane"}],
    "47-lab-cka-18-apiserver.md",
    "18",
    """
        `kubectl` requests are timing out or are extremely slow.

        Diagnose: kubectl → API endpoint → kube-apiserver → etcd (and the node's network).
        Restore a usable API.
    """,
    root_cause="netem delay on the control-plane data path.",
)

tshoot(
    "cka-19-etcd",
    "CKA 19 — etcd degradation",
    "cka-19",
    [
        {"op": "tc_delay", "node": "control-plane", "value": "2000ms"},
    ],
    [
        {"type": "etcd_healthy", "desc": "etcd process still present"},
    ],
    "The API is extremely slow. Investigate etcd members, leader, health, latency, disk, quorum. Restore health.",
    [
        {"type": "etcd_healthy", "desc": "etcd healthy", "points": 5},
        {"type": "control_plane_healthy", "desc": "control plane healthy", "points": 5},
    ],
    [{"op": "tc_clear", "node": "control-plane"}],
    "48-lab-cka-19-etcd.md",
    "19",
    """
        The Kubernetes API is extremely slow.

        Investigate etcd members, leader, health, latency, disk, and quorum.
        Restore control-plane health.
    """,
    root_cause="Artificial latency in front of the control plane / etcd path.",
)

tshoot(
    "cka-20-oom",
    "CKA 20 — OOMKilled",
    "cka-20",
    [
        {"op": "delete_namespace", "name": "cka-20"},
        {"op": "ensure_namespace", "name": "cka-20"},
        {"op": "apply", "file": "manifests/oom-backend.yaml"},
        {"op": "sleep", "value": "8"},
    ],
    [
        {"type": "exists", "kind": "deployment", "name": "backend", "namespace": "cka-20", "desc": "backend Deployment exists"},
    ],
    "Backend in cka-20 restarts repeatedly. Find the memory/cgroup issue and fix it so the Pod stays Running with restartCount stable.",
    [
        {"type": "deployment_ready", "name": "backend", "namespace": "cka-20", "desc": "backend Ready", "points": 6},
        {"type": "restart_count", "name": "backend", "namespace": "cka-20", "max": 8, "desc": "restarts not climbing without bound", "points": 4},
    ],
    [{"op": "delete_namespace", "name": "cka-20"}],
    "49-lab-cka-20-oom.md",
    "20",
    """
        Backend Pods in namespace `cka-20` are repeatedly restarting.

        The cause is related to memory limits / cgroups.
        Identify the problem and fix it so the workload stays Running.
    """,
    root_cause="Memory limit below what the process allocates.",
)

tshoot(
    "cka-21-diskpressure",
    "CKA 21 — DiskPressure",
    "cka-21",
    [
        {"op": "fill_disk", "node": "worker-1", "size": "3G"},
    ],
    [
        {"type": "api_reachable", "desc": "API reachable"},
    ],
    "A node is under DiskPressure / evicting. Use df, du, inodes, containerd, kubelet logs. Free the node.",
    [
        {"type": "disk_usage_below", "node": "worker-1", "path": "/", "max": 90, "desc": "root filesystem not full", "points": 6},
        {"type": "node_ready", "node": "worker-1", "desc": "worker Ready", "points": 4},
    ],
    [{"op": "unfill_disk", "node": "worker-1"}],
    "50-lab-cka-21-diskpressure.md",
    "21",
    """
        A node is evicting workloads because of resource pressure (disk).

        Find the cause on Linux (`df`, `du`, inodes, containerd, kubelet, logs)
        and restore the node.
    """,
    root_cause="A large fill file under /var/tmp.",
)

tshoot(
    "cka-22-scheduling",
    "CKA 22 — Scheduling failure",
    "cka-22",
    [
        {"op": "delete_namespace", "name": "cka-22"},
        {"op": "ensure_namespace", "name": "cka-22"},
        {"op": "label_node", "node": "worker-1", "key": "zone", "value": "a"},
        {"op": "label_node", "node": "worker-2", "key": "zone", "value": "b"},
        {"op": "taint_node", "node": "worker-2", "key": "dedicated", "value": "batch", "effect": "NoSchedule"},
        {"op": "kubectl", "args": ["-n", "cka-22", "run", "stuck", "--image=nginx:1.27", "--overrides", '{"spec":{"nodeSelector":{"zone":"b"}}}']},
    ],
    [
        {"type": "pod_pending", "name": "stuck", "namespace": "cka-22", "desc": "workload stuck is Pending"},
    ],
    "Workload stuck in cka-22 is scheduled incorrectly / not at all. Use labels, selectors, affinity, taints, resources. Make it Running on a node that can take it. Do not remove unrelated production taints on the control plane.",
    [
        {"type": "pod_running", "name": "stuck", "namespace": "cka-22", "desc": "Pod stuck is Running", "points": 10},
    ],
    [
        {"op": "delete_namespace", "name": "cka-22"},
        {"op": "unlabel_node", "node": "worker-1", "key": "zone"},
        {"op": "unlabel_node", "node": "worker-2", "key": "zone"},
        {"op": "untaint_node", "node": "worker-2", "key": "dedicated", "value": "batch", "effect": "NoSchedule"},
    ],
    "51-lab-cka-22-scheduling.md",
    "22",
    """
        Workload `stuck` in namespace `cka-22` is not scheduled correctly.
        Cluster capacity is not being used the way the labels/taints imply.

        Fix scheduling (labels, nodeSelector, affinity, taints/tolerations, resources).
        The Pod must become Running.
    """,
    root_cause="nodeSelector targets a tainted zone with no toleration.",
)

tshoot(
    "cka-23-drain",
    "CKA 23 — Cordon / drain",
    "cka-23",
    [
        {"op": "delete_namespace", "name": "cka-23"},
        {"op": "ensure_namespace", "name": "cka-23"},
        {"op": "apply", "file": "manifests/drain-web.yaml"},
        {"op": "wait", "kind": "deployment", "name": "web", "namespace": "cka-23"},
    ],
    [
        {"type": "deployment_ready", "name": "web", "namespace": "cka-23", "desc": "web is healthy"},
    ],
    "Cordon and drain worker-1 without violating the PDB. web must stay available. Node unschedulable. DaemonSets are not your application.",
    [
        {"type": "node_unschedulable", "node": "worker-1", "value": "true", "desc": "worker-1 cordoned", "points": 4},
        {"type": "deployment_ready", "name": "web", "namespace": "cka-23", "min": 1, "desc": "web still Ready", "points": 6},
    ],
    [
        {"op": "uncordon", "node": "worker-1"},
        {"op": "delete_namespace", "name": "cka-23"},
    ],
    "52-lab-cka-23-drain.md",
    "23",
    """
        Take worker 1 out of service **without** application downtime.

        Namespace `cka-23` has Deployment `web` and a PodDisruptionBudget.
        Respect the PDB. DaemonSets and local storage are in play on a real node.

        Leave the node cordoned when you finish. Cleanup will uncordon.
    """,
    root_cause="Need cordon+drain respecting PDB (not delete --force).",
)

tshoot(
    "cka-24-cni",
    "CKA 24 — Broken CNI",
    "cka-24",
    [
        {"op": "ssh", "node": "worker-1", "command": "ip link set cni0 down 2>/dev/null || ip link set flannel.1 down 2>/dev/null || true"},
    ],
    [
        {"type": "api_reachable", "desc": "API reachable"},
    ],
    "Pod-to-Pod traffic between nodes is broken. Diagnose Linux networking and CNI. Restore it.",
    [
        {"type": "cni_healthy", "desc": "CNI healthy", "points": 5},
        {"type": "nodes_ready", "min": 3, "desc": "nodes Ready", "points": 5},
    ],
    [
        {"op": "ssh", "node": "worker-1", "command": "ip link set cni0 up 2>/dev/null || ip link set flannel.1 up 2>/dev/null || true"},
    ],
    "53-lab-cka-24-cni.md",
    "24",
    """
        Pod-to-Pod traffic between nodes is broken.

        Diagnose Linux networking and the CNI yourself. Restore cross-node Pod connectivity.
    """,
    root_cause="A CNI bridge/interface was put down on a worker.",
)

tshoot(
    "cka-25-coredns",
    "CKA 25 — Broken CoreDNS",
    "cka-25",
    [
        {"op": "kubectl", "args": ["-n", "kube-system", "set", "image", "deploy/coredns", "coredns=nginx:does-not-exist"]},
        {"op": "sleep", "value": "5"},
    ],
    [
        {"type": "api_reachable", "desc": "API reachable"},
    ],
    "CoreDNS is intentionally broken (CrashLoop or Running-but-useless). Find the root cause. Restore cluster DNS.",
    [
        {"type": "coredns_healthy", "desc": "CoreDNS healthy", "points": 5},
        {"type": "dns_resolves", "name": "kubernetes.default.svc.cluster.local", "namespace": "default", "desc": "DNS works", "points": 5},
    ],
    [
        {"op": "kubectl", "args": ["-n", "kube-system", "rollout", "undo", "deploy/coredns"]},
    ],
    "54-lab-cka-25-coredns.md",
    "25",
    """
        CoreDNS is broken on purpose.

        It may be CrashLoopBackOff, or Running while DNS still fails.
        Find the root cause yourself and restore internal DNS.
    """,
    root_cause="CoreDNS image was pointed at a nonexistent image.",
)


# ---------- admin 26-30 ----------
add(
    {
        "id": "cka-26-add-worker",
        "title": "Add a worker",
        "track": "admin",
        "prerequisites": HEALTHY,
        "setup": [],
        "initial_state": [{"type": "nodes_ready", "min": 3, "desc": "starting from three Ready nodes"}],
        "task": "Add LXC node-04 (192.168.56.13) through Kubespray. Node Ready, CNI on it, schedulable.",
        "verify": [
            {"type": "node_count", "min": 4, "desc": "four nodes registered", "points": 4},
            {"type": "nodes_ready", "min": 4, "desc": "four Ready", "points": 4},
            {"type": "cni_healthy", "desc": "CNI healthy", "points": 2},
        ],
        "cleanup": [],
    },
    "61-lab-cka-26-add-worker.md",
    "CKA 26 — Add a worker",
    cka_page("26", "add", "Add a worker", """
        The cluster needs another worker.

        Add a new LXC node `node-04` (`192.168.56.13`) **through Kubespray**.
        It must become Ready, receive CNI, and accept Pods.
    """),
)

add(
    {
        "id": "cka-27-remove-worker",
        "title": "Remove a worker",
        "track": "admin",
        "prerequisites": [{"type": "api_reachable", "desc": "API reachable"}, {"type": "node_count", "min": 4, "desc": "node-04 still in the cluster"}],
        "setup": [],
        "initial_state": [{"type": "node_count", "min": 4, "desc": "four nodes present"}],
        "task": "Permanently decommission node-04 from the cluster and from infrastructure (Kubespray remove-node + drop the LXC node).",
        "verify": [
            {"type": "node_count", "min": 3, "desc": "back to three nodes", "points": 4},
            {"type": "nodes_ready", "min": 3, "desc": "three Ready", "points": 4},
            {"type": "absent", "kind": "node", "name": "node-04", "desc": "node-04 gone", "points": 2},
        ],
        "cleanup": [],
    },
    "62-lab-cka-27-remove-worker.md",
    "CKA 27 — Remove a worker",
    cka_page("27", "rm", "Remove a worker", """
        Permanently decommission `node-04` from the cluster **and** from the infrastructure.

        Drain/remove via Kubespray (or the supported remove-node playbook), then delete the LXC node.
        Leave three healthy nodes.
    """),
)

add(
    {
        "id": "cka-28-upgrade",
        "title": "Kubernetes upgrade",
        "track": "admin",
        "prerequisites": HEALTHY,
        "setup": [],
        "initial_state": [{"type": "nodes_ready", "min": 3, "desc": "cluster healthy before upgrade"}],
        "task": "Upgrade the cluster to the next supported 1.32.x (or the minor Kubespray documents). Check health after each stage.",
        "verify": [
            {"type": "kubernetes_version", "value": "v1.32", "desc": "server version 1.32.x", "points": 6},
            {"type": "nodes_ready", "min": 3, "desc": "nodes Ready after upgrade", "points": 4},
        ],
        "cleanup": [],
    },
    "63-lab-cka-28-upgrade.md",
    "CKA 28 — Kubernetes upgrade",
    cka_page("28", "up", "Kubernetes upgrade", """
        Upgrade the cluster to the next supported Kubernetes minor (`v1.32.x` unless
        your Kubespray release documents a different target).

        Upgrade with minimal disruption. Verify health after each stage
        (kubelet, control plane, workers).
    """),
)

add(
    {
        "id": "cka-29-etcd-backup",
        "title": "etcd backup",
        "track": "admin",
        "prerequisites": HEALTHY,
        "setup": [],
        "initial_state": [{"type": "etcd_healthy", "desc": "etcd healthy"}],
        "task": "Create an etcd snapshot at ~/kuber-cka/etcd-snapshot.db and prove it is a valid snapshot.",
        "verify": [
            {"type": "snapshot_valid", "path": "~/kuber-cka/etcd-snapshot.db", "desc": "snapshot file exists and is non-empty", "points": 10},
        ],
        "cleanup": [],
    },
    "64-lab-cka-29-etcd-backup.md",
    "CKA 29 — etcd backup",
    cka_page("29", "bak", "etcd backup", """
        Create a recoverable etcd snapshot at:

        `~/kuber-cka/etcd-snapshot.db`

        Validate it (`etcdctl snapshot status` or equivalent). Keep the file for CKA 30.
    """),
)

add(
    {
        "id": "cka-30-etcd-restore",
        "title": "etcd restore",
        "track": "admin",
        "prerequisites": [
            {"type": "api_reachable", "desc": "API reachable"},
            {"type": "snapshot_valid", "path": "~/kuber-cka/etcd-snapshot.db", "desc": "backup from CKA 29 exists"},
        ],
        "setup": [
            {"op": "ensure_namespace", "name": "cka-30"},
            {"op": "kubectl", "args": ["-n", "cka-30", "create", "configmap", "restore-marker", "--from-literal=ok=yes"]},
            {"op": "delete_namespace", "name": "cka-30"},
        ],
        "initial_state": [
            {"type": "snapshot_valid", "path": "~/kuber-cka/etcd-snapshot.db", "desc": "snapshot available"},
        ],
        "task": "etcd data for the marker namespace was removed. Restore from ~/kuber-cka/etcd-snapshot.db. Control plane and workloads must come back. If your snapshot predates cka-30, restore procedure + healthy etcd/API is the bar — recreate shop if needed.",
        "verify": [
            {"type": "etcd_healthy", "desc": "etcd healthy", "points": 4},
            {"type": "control_plane_healthy", "desc": "API server healthy", "points": 3},
            {"type": "nodes_ready", "min": 3, "desc": "nodes Ready", "points": 3},
        ],
        "cleanup": [],
        "explanation": "A full etcd restore is destructive. The grader checks control-plane health after you restore. Keep a copy of admin.conf.",
    },
    "65-lab-cka-30-etcd-restore.md",
    "CKA 30 — etcd restore",
    cka_page("30", "rst", "etcd restore", """
        etcd data has been disturbed. A snapshot is at `~/kuber-cka/etcd-snapshot.db`.

        Restore the control plane from that backup.
        Verify etcd → API Server → objects → workloads.

        This is the most dangerous lab on the stand. Read the Kubespray / etcd restore
        notes before you start. **Cleanup does not invent a new etcd for you.**
    """),
)


# ---------- ON-CALL ----------
ONCALL = [
    ("01", "P2", "Pod Pending", "A production workload is stuck in Pending.\n\nInvestigate and restore service.", "cka-12-pending", "71-lab-oncall-01.md"),
    ("02", "P1", "Node NotReady", "One Kubernetes node is NotReady.\nSeveral workloads are affected.\n\nRestore cluster health.", "cka-13-notready", "72-lab-oncall-02.md"),
    ("03", "P1", "Pod-to-Pod networking", "Applications running on different nodes\ncannot communicate with each other.", "cka-24-cni", "73-lab-oncall-03.md"),
    ("04", "P1", "Service unavailable", "Backend Service is unavailable,\nwhile backend Pods appear healthy.", "cka-14-service", "74-lab-oncall-04.md"),
    ("05", "P1", "DNS failure", "Applications cannot resolve internal\nKubernetes service names.", "cka-15-dns", "75-lab-oncall-05.md"),
    ("06", "P2", "Internet egress", "Applications cannot access external APIs.", "cka-16-egress", "76-lab-oncall-06.md"),
    ("07", "P1", "Ingress only works on one node", "Frontend is reachable through one Kubernetes\nnode but unavailable through the others.", "cka-17-ingress", "77-lab-oncall-07.md"),
    ("08", "P1", "API Server timeout", "kubectl requests are timing out intermittently.", "cka-18-apiserver", "78-lab-oncall-08.md"),
    ("09", "P1", "etcd degradation", "Kubernetes API is extremely slow.\nInvestigate control-plane health.", "cka-19-etcd", "79-lab-oncall-09.md"),
    ("10", "P2", "OOMKilled", "Backend Pods are repeatedly restarting.", "cka-20-oom", "80-lab-oncall-10.md"),
    ("11", "P1", "DiskPressure", "A node is evicting workloads because of\nresource pressure.", "cka-21-diskpressure", "81-lab-oncall-11.md"),
    ("12", "P2", "Scheduling", "New workloads are being scheduled incorrectly\nand cluster capacity is not being used properly.", "cka-22-scheduling", "82-lab-oncall-12.md"),
    ("13", "P2", "Node maintenance", "A worker node must be taken out of service\nwithout application downtime.", "cka-23-drain", "83-lab-oncall-13.md"),
    ("14", "P1", "CNI failure", "Pod networking is broken on part of the cluster.", "cka-24-cni", "84-lab-oncall-14.md"),
    ("15", "P1", "CoreDNS failure", "Internal DNS resolution has stopped working.", "cka-25-coredns", "85-lab-oncall-15.md"),
    ("16", "P2", "Add worker", "The cluster needs additional compute capacity.\nAdd a new worker node.", "cka-26-add-worker", "86-lab-oncall-16.md"),
    ("17", "P2", "Remove worker", "A worker node must be permanently decommissioned.", "cka-27-remove-worker", "87-lab-oncall-17.md"),
    ("18", "P2", "Kubernetes upgrade", "Upgrade the Kubernetes cluster to the required\nversion with minimal disruption.", "cka-28-upgrade", "88-lab-oncall-18.md"),
    ("19", "P2", "etcd backup", "Create and validate a recoverable etcd backup.", "cka-29-etcd-backup", "89-lab-oncall-19.md"),
    ("20", "P1", "Disaster recovery", "The etcd data has been lost/corrupted.\n\nRestore the Kubernetes control plane\nfrom the available backup.", "cka-30-etcd-restore", "90-lab-oncall-20.md"),
]


def clone_oncall(src_id: str, new_id: str, num: str, priority: str, title: str, body: str) -> dict:
    src = next(x for x in LAB_DEFS if x["id"] == src_id)
    cloned = json.loads(json.dumps(src))
    cloned["id"] = new_id
    cloned["title"] = f"ON-CALL {num} — {title}"
    cloned["track"] = "oncall"
    cloned["ticket"] = {"id": f"INC-{num}", "priority": priority, "title": title, "body": body}
    cloned["task"] = body
    if cloned.get("namespace"):
        new_ns = f"oncall-{num}"
        old_ns = cloned["namespace"]
        blob = json.dumps(cloned)
        blob = blob.replace(old_ns, new_ns)
        cloned = json.loads(blob)
        cloned["namespace"] = new_ns
        # restore id/title after replace
        cloned["id"] = new_id
        cloned["title"] = f"ON-CALL {num} — {title}"
    return cloned


for num, pri, title, body, src, md_file in ONCALL:
    oid = f"oncall-{num}"
    lab = clone_oncall(src, oid, num, pri, title, body)
    LAB_DEFS.append(lab)
    MD.append(
        (
            md_file,
            lab["title"],
            oncall_page(num, pri, title, body),
            oid,
        )
    )


# ---------- mock ----------
add(
    {
        "id": "mock-exam",
        "title": "Final CKA mock",
        "track": "mock",
        "hide_hints": True,
        "hide_root_cause": True,
        "pass_score": 80,
        "prerequisites": HEALTHY,
        "setup": [
            {"op": "delete_namespace", "name": "exam"},
            {"op": "ensure_namespace", "name": "exam"},
        ],
        "initial_state": [{"type": "namespace_exists", "name": "exam", "desc": "exam namespace ready"}],
        "task": dedent(
            """
            Timed mock (2 hours, you run the timer).

            1. Pod exam-nginx in exam: nginx:1.27, port 80, Running (15)
            2. Deployment exam-web in exam: 2 replicas nginx:1.27, rollout complete (15)
            3. ClusterIP exam-web-svc selecting app=exam-web port 80 targetPort 80 with endpoints (15)
            4. Ingress exam-web host exam.example.com → exam-web-svc (15)
            5. ConfigMap exam-cfg KEY=cka used by Deployment exam-web (10)
            6. PVC exam-data 1Gi RWO Bound (15)
            7. Pod exam-disk mounts exam-data, Running (15)
            """
        ),
        "verify": [
            {"type": "pod_running", "name": "exam-nginx", "namespace": "exam", "desc": "Pod exam-nginx Running", "points": 15},
            {"type": "rollout_complete", "name": "exam-web", "namespace": "exam", "desc": "exam-web rollout", "points": 15},
            {"type": "exists", "kind": "service", "name": "exam-web-svc", "namespace": "exam", "desc": "exam-web-svc", "points": 5},
            {"type": "endpoints", "name": "exam-web-svc", "namespace": "exam", "desc": "service endpoints", "points": 10},
            {"type": "ingress_host", "name": "exam-web", "namespace": "exam", "host": "exam.example.com", "desc": "Ingress host", "points": 15},
            {"type": "exists", "kind": "configmap", "name": "exam-cfg", "namespace": "exam", "desc": "ConfigMap exam-cfg", "points": 10},
            {"type": "pvc_bound", "name": "exam-data", "namespace": "exam", "desc": "PVC Bound", "points": 15},
            {"type": "pod_running", "name": "exam-disk", "namespace": "exam", "desc": "exam-disk Running", "points": 15},
        ],
        "cleanup": [{"op": "delete_namespace", "name": "exam"}],
    },
    "99-mock-exam.md",
    "Final CKA mock",
    None,
)


catalog = {
    "course": "kuber-cka",
    "tracks": ["bootstrap", "cka", "troubleshooting", "admin", "oncall", "mock"],
    "labs": [],
}

prev = None
for lab in LAB_DEFS:
    entry = {"id": lab["id"], "title": lab["title"], "track": lab["track"]}
    if lab["track"] == "mock":
        entry["optional"] = True
        entry["first"] = True
        entry["after"] = None
    elif prev is None:
        entry["first"] = True
    catalog["labs"].append(entry)
    if lab["track"] != "mock":
        prev = lab["id"]

dump(LABS / "catalog.yaml", catalog)

for lab in LAB_DEFS:
    dump(LABS / f"{lab['id']}.yaml", lab)

for md_file, title, body, lab_id in MD:
    if body:
        lesson(md_file, title, body, lab_id)
    else:
        # existing markdown — sidecar only
        sidecar = {
            "id": f"kuber-cka/{Path(md_file).stem}",
            "title": title,
            "backend": "labctl",
            "labId": lab_id,
            "setup": [],
            "checks": [],
            "cleanup": [],
        }
        (ROOT / md_file.replace(".md", ".lab.json")).write_text(
            json.dumps(sidecar, indent=2) + "\n", encoding="utf-8"
        )

print(f"wrote {len(LAB_DEFS)} labs")
