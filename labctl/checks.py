"""Result-only cluster / node / filesystem assertions."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from labctl import kube, ssh
from labctl.models import Check
from labctl.paths import workdir


@dataclass
class Result:
    name: str
    passed: bool
    message: str = ""

    def as_dict(self) -> dict:
        return {"name": self.name, "passed": self.passed, "message": self.message}


def evaluate(check: Check) -> Result:
    handler = _HANDLERS.get(check.type)
    label = check.desc or f"{check.type}: {check.kind}/{check.name}".strip(":/ ")
    if handler is None:
        return Result(label, False, f"unknown check type {check.type!r}")
    try:
        ok, msg = handler(check)
        return Result(label, ok, msg)
    except kube.KubeError as exc:
        return Result(label, False, str(exc))
    except ssh.SSHError as exc:
        return Result(label, False, str(exc))
    except Exception as exc:  # noqa: BLE001 — surface unexpected probe errors
        return Result(label, False, str(exc))


def evaluate_all(checks: list[Check]) -> list[Result]:
    return [evaluate(c) for c in checks]


def _ns(check: Check) -> str:
    return check.namespace


def cluster_healthy(_: Check) -> tuple[bool, str]:
    if not kube.api_reachable():
        return False, "Kubernetes API is not reachable"
    ready = kube.ready_node_count()
    if ready < 1:
        return False, "no Ready nodes"
    if not _coredns_ok():
        return False, "CoreDNS is not healthy"
    return True, f"API reachable, {ready} Ready node(s), CoreDNS healthy"


def api_reachable(_: Check) -> tuple[bool, str]:
    if kube.api_reachable():
        return True, "API ready"
    return False, "API not reachable"


def kubernetes_version(check: Check) -> tuple[bool, str]:
    data = kube.kubectl_json("version")
    git = ""
    if isinstance(data, dict):
        git = (
            kube.walk(data, "serverVersion", "gitVersion")
            or kube.walk(data, "serverVersion", "gitVersion")
            or ""
        )
        if not git:
            git = str((data.get("serverVersion") or {}).get("gitVersion") or "")
    git = str(git)
    want = check.value
    if want and want not in git:
        return False, f"version {git or 'unknown'}, want {want}"
    return True, git or "ok"


def nodes_ready(check: Check) -> tuple[bool, str]:
    want = int(check.min or check.value or 1)
    names = kube.node_names()
    ready = [n for n in names if kube.node_ready(n)]
    not_ready = [n for n in names if n not in ready]
    if len(ready) < want:
        detail = f"{len(ready)}/{len(names)} Ready (want >= {want})"
        if not_ready:
            detail += f"; not Ready: {', '.join(not_ready)}"
        return False, detail
    return True, f"{len(ready)} Ready"


def node_count(check: Check) -> tuple[bool, str]:
    got = len(kube.node_names())
    want = int(check.min or check.value or 0)
    if got < want:
        return False, f"{got} nodes, want >= {want}"
    return True, f"{got} nodes"


def node_is_ready(check: Check) -> tuple[bool, str]:
    name = kube.resolve_node(check.node or check.name)
    if not name:
        return False, "node not found"
    if kube.node_ready(name):
        return True, f"{name} Ready"
    return False, f"{name} is not Ready"


def node_is_not_ready(check: Check) -> tuple[bool, str]:
    name = kube.resolve_node(check.node or check.name)
    if not name:
        return False, "node not found"
    if kube.node_ready(name):
        return False, f"{name} is Ready (expected NotReady)"
    return True, f"{name} NotReady"


def control_plane_healthy(_: Check) -> tuple[bool, str]:
    pods = kube.list_resources("pods", namespace="kube-system")
    needed = ("kube-apiserver", "kube-controller-manager", "kube-scheduler")
    missing = []
    for prefix in needed:
        found = [
            p
            for p in pods
            if str(p.get("metadata", {}).get("name", "")).startswith(prefix)
            and p.get("status", {}).get("phase") == "Running"
        ]
        if not found:
            missing.append(prefix)
    if missing:
        return False, "not running: " + ", ".join(missing)
    return True, "apiserver, controller-manager, scheduler Running"


def etcd_healthy(_: Check) -> tuple[bool, str]:
    pods = kube.list_resources("pods", namespace="kube-system")
    etcd = [
        p
        for p in pods
        if str(p.get("metadata", {}).get("name", "")).startswith("etcd")
        and p.get("status", {}).get("phase") == "Running"
    ]
    if not etcd:
        return False, "no Running etcd Pod in kube-system"
    return True, f"{len(etcd)} etcd Pod(s) Running"


def coredns_healthy(_: Check) -> tuple[bool, str]:
    if _coredns_ok():
        return True, "CoreDNS Ready"
    return False, "CoreDNS is not Ready"


def _coredns_ok() -> bool:
    pods = kube.list_resources("pods", namespace="kube-system", selector="k8s-app=kube-dns")
    if not pods:
        pods = [
            p
            for p in kube.list_resources("pods", namespace="kube-system")
            if "coredns" in str(p.get("metadata", {}).get("name", ""))
        ]
    ready = 0
    for pod in pods:
        if pod.get("status", {}).get("phase") != "Running":
            continue
        for cs in pod.get("status", {}).get("containerStatuses") or []:
            if cs.get("ready"):
                ready += 1
                break
    return ready >= 1


def cni_healthy(_: Check) -> tuple[bool, str]:
    pods = kube.list_resources("pods", namespace="kube-system")
    names = [str(p.get("metadata", {}).get("name", "")) for p in pods]
    cni = [
        n
        for n in names
        if any(tok in n for tok in ("calico", "cilium", "flannel", "weave", "canal"))
    ]
    running = [
        p
        for p in pods
        if str(p.get("metadata", {}).get("name", "")) in cni
        and p.get("status", {}).get("phase") == "Running"
    ]
    if not cni:
        # overlay may live as a DaemonSet in another namespace
        dss = kube.list_resources("daemonsets", namespace="kube-system")
        for ds in dss:
            name = str(ds.get("metadata", {}).get("name", ""))
            if any(tok in name for tok in ("calico", "cilium", "flannel", "kube-proxy")):
                desired = int(kube.walk(ds, "status", "desiredNumberScheduled") or 0)
                ready = int(kube.walk(ds, "status", "numberReady") or 0)
                if desired and ready >= desired:
                    return True, f"{name} {ready}/{desired}"
        return False, "no CNI DaemonSet/Pods found"
    if len(running) < 1:
        return False, "CNI Pods are not Running"
    return True, f"{len(running)} CNI Pod(s) Running"


def namespace_exists(check: Check) -> tuple[bool, str]:
    name = check.name or check.namespace
    if kube.get_resource("namespace", name):
        return True, name
    return False, f"namespace {name} not found"


def namespace_absent(check: Check) -> tuple[bool, str]:
    name = check.name or check.namespace
    if kube.get_resource("namespace", name):
        return False, f"namespace {name} still exists"
    return True, f"{name} absent"


def resource_exists(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind, check.name, _ns(check))
    if obj:
        return True, "found"
    return False, f"{check.kind}/{check.name} not found"


def resource_absent(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind, check.name, _ns(check))
    if obj:
        return False, f"{check.kind}/{check.name} still exists"
    return True, "absent"


def pod_phase(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("pod", check.name, _ns(check))
    if not obj:
        return False, "pod not found"
    phase = str(kube.walk(obj, "status", "phase") or "")
    want = check.value or "Running"
    return phase == want, f"phase={phase}"


def pod_running(check: Check) -> tuple[bool, str]:
    check.value = "Running"
    return pod_phase(check)


def pod_pending(check: Check) -> tuple[bool, str]:
    check.value = "Pending"
    return pod_phase(check)


def pod_image(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind or "pod", check.name, _ns(check))
    if not obj:
        return False, "not found"
    want = check.image or check.value
    images = [str(c.get("image") or "") for c in kube.containers_of(obj)]
    if want in images:
        return True, want
    return False, "images: " + ", ".join(images) if images else "no containers"


def pod_port(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("pod", check.name, _ns(check))
    if not obj:
        return False, "pod not found"
    want = int(check.port or check.value or 0)
    for c in kube.containers_of(obj):
        for p in c.get("ports") or []:
            if int(p.get("containerPort") or 0) == want:
                return True, f"containerPort={want}"
    return False, f"containerPort {want} not set"


def pod_resources(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("pod", check.name, _ns(check))
    if not obj:
        return False, "pod not found"
    missing = []
    for c in kube.containers_of(obj):
        req = (c.get("resources") or {}).get("requests") or {}
        lim = (c.get("resources") or {}).get("limits") or {}
        pairs = (
            ("cpu request", req.get("cpu"), check.request_cpu, "cpu"),
            ("memory request", req.get("memory"), check.request_memory, "memory"),
            ("cpu limit", lim.get("cpu"), check.limit_cpu, "cpu"),
            ("memory limit", lim.get("memory"), check.limit_memory, "memory"),
        )
        for label, got, want, kind in pairs:
            if want and not kube.qty_equal(str(got or ""), want, kind):
                missing.append(f"{label}={got or 'unset'} (want {want})")
        if not missing:
            return True, "requests/limits match"
    return False, "; ".join(missing) or "no containers"


def restart_count(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("pod", check.name, _ns(check))
    if not obj:
        return False, "pod not found"
    total = 0
    for cs in obj.get("status", {}).get("containerStatuses") or []:
        total += int(cs.get("restartCount") or 0)
    limit = int(check.max if check.max is not None else (check.value or 0))
    if total > limit:
        return False, f"restarts={total} (want <= {limit})"
    return True, f"restarts={total}"


def deployment_replicas(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("deployment", check.name, _ns(check))
    if not obj:
        return False, "deployment not found"
    got = int(kube.walk(obj, "spec", "replicas") or 0)
    want = int(check.value or check.min or 1)
    return got == want, f"spec.replicas={got} (want {want})"


def deployment_ready(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("deployment", check.name, _ns(check))
    if not obj:
        return False, "deployment not found"
    want = int(check.value or check.min or kube.walk(obj, "spec", "replicas") or 1)
    got = int(kube.walk(obj, "status", "readyReplicas") or 0)
    return got >= want, f"{got}/{want} ready"


def rollout_complete(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("deployment", check.name, _ns(check))
    if not obj:
        return False, "deployment not found"
    spec = int(kube.walk(obj, "spec", "replicas") or 0)
    updated = int(kube.walk(obj, "status", "updatedReplicas") or 0)
    ready = int(kube.walk(obj, "status", "readyReplicas") or 0)
    ok = spec > 0 and updated >= spec and ready >= spec
    return ok, f"updated={updated} ready={ready} spec={spec}"


def replicaset_min(check: Check) -> tuple[bool, str]:
    items = kube.list_resources(
        "replicasets",
        namespace=_ns(check),
        selector=check.key and f"{check.key}={check.value}" or "",
    )
    if check.name:
        items = [
            i
            for i in kube.list_resources("replicasets", namespace=_ns(check))
            if str(i.get("metadata", {}).get("name", "")).startswith(check.name)
        ]
    want = int(check.min or check.value or 1)
    return len(items) >= want, f"{len(items)} ReplicaSets (want >= {want})"


def workload_image(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind or "deployment", check.name, _ns(check))
    if not obj:
        return False, "not found"
    want = check.image or check.value
    images = [str(c.get("image") or "") for c in kube.containers_of(obj)]
    if want in images:
        return True, want
    return False, "images: " + ", ".join(images)


def label_eq(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind, check.name, _ns(check))
    if not obj:
        return False, "not found"
    labels = obj.get("metadata", {}).get("labels") or {}
    tmpl = kube.walk(obj, "spec", "template", "metadata", "labels") or {}
    if labels.get(check.key) == check.value or tmpl.get(check.key) == check.value:
        return True, f"{check.key}={check.value}"
    return False, f"label {check.key}={check.value} not set"


def env_eq(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind or "pod", check.name, _ns(check))
    if not obj:
        return False, "not found"
    for c in kube.containers_of(obj):
        for ev in c.get("env") or []:
            if ev.get("name") == check.key and ev.get("value") == check.value:
                return True, f"{check.key}={check.value}"
            if ev.get("name") == check.key and ev.get("valueFrom"):
                return True, f"{check.key} from valueFrom"
    return False, f"env {check.key}={check.value} not set"


def has_key(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind, check.name, _ns(check))
    if not obj:
        return False, "not found"
    data = obj.get("data") or {}
    if check.key not in data:
        return False, f"no key {check.key}"
    if check.value and str(data.get(check.key)) != check.value:
        return False, f"key {check.key} has a different value"
    return True, f"key {check.key}"


def env_from_configmap(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind or "deployment", check.name, _ns(check))
    if not obj:
        return False, "not found"
    want = check.value or check.extra.get("configmap") or check.extra.get("ref")
    for c in kube.containers_of(obj):
        for ev in c.get("envFrom") or []:
            ref = (ev.get("configMapRef") or {}).get("name")
            if ref == want:
                return True, f"envFrom {want}"
        for ev in c.get("env") or []:
            src = kube.walk(ev, "valueFrom", "configMapKeyRef", "name")
            if src == want:
                return True, f"env from {want}"
    vols = kube.walk(obj, "spec", "volumes") or kube.walk(
        obj, "spec", "template", "spec", "volumes"
    ) or []
    for vol in vols:
        if (vol.get("configMap") or {}).get("name") == want:
            return True, f"volume from {want}"
    return False, f"ConfigMap {want} not referenced"


def env_from_secret(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind or "pod", check.name, _ns(check))
    if not obj:
        return False, "not found"
    want = check.value or check.extra.get("secret")
    for c in kube.containers_of(obj):
        for ev in c.get("envFrom") or []:
            if (ev.get("secretRef") or {}).get("name") == want:
                return True, f"envFrom secret {want}"
        for ev in c.get("env") or []:
            src = kube.walk(ev, "valueFrom", "secretKeyRef", "name")
            if src == want:
                return True, f"env from secret {want}"
    vols = kube.walk(obj, "spec", "volumes") or kube.walk(
        obj, "spec", "template", "spec", "volumes"
    ) or []
    for vol in vols:
        if (vol.get("secret") or {}).get("secretName") == want:
            return True, f"volume from secret {want}"
    return False, f"Secret {want} not referenced"


def service_type(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("service", check.name, _ns(check))
    if not obj:
        return False, "service not found"
    got = str(kube.walk(obj, "spec", "type") or "ClusterIP")
    want = check.value or "ClusterIP"
    return got == want, f"type={got}"


def service_selector(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("service", check.name, _ns(check))
    if not obj:
        return False, "service not found"
    sel = kube.walk(obj, "spec", "selector") or {}
    if check.labels:
        missing = [f"{k}={v}" for k, v in check.labels.items() if sel.get(k) != v]
        if missing:
            return False, "selector missing " + ", ".join(missing)
        return True, "selector matches"
    if sel.get(check.key) == check.value:
        return True, f"{check.key}={check.value}"
    return False, f"selector {check.key}={check.value} not set"


def service_port(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("service", check.name, _ns(check))
    if not obj:
        return False, "service not found"
    want_port = int(check.port or check.value or 0)
    want_target = int(check.target_port or 0)
    for p in kube.walk(obj, "spec", "ports") or []:
        port = int(p.get("port") or 0)
        target = p.get("targetPort")
        if want_port and port != want_port:
            continue
        if want_target and int(target or 0) != want_target:
            return False, f"targetPort={target} (want {want_target})"
        return True, f"port={port} targetPort={target}"
    return False, f"port {want_port or '?'} not found"


def endpoints_populated(check: Check) -> tuple[bool, str]:
    want = int(check.min or check.value or 1)
    slices = kube.list_resources("endpointslices", namespace=_ns(check))
    count = 0
    for item in slices:
        owners = item.get("metadata", {}).get("labels") or {}
        svc = owners.get("kubernetes.io/service-name")
        if check.name and svc != check.name:
            continue
        for ep in item.get("endpoints") or []:
            cond = ep.get("conditions") or {}
            if cond.get("ready", True) is False:
                continue
            count += len(ep.get("addresses") or [])
    if count < want:
        # Endpoints v1 fallback
        obj = kube.get_resource("endpoints", check.name, _ns(check))
        if obj:
            for ss in obj.get("subsets") or []:
                count += len(ss.get("addresses") or [])
    if count < want:
        return False, f"{count} ready address(es), want >= {want}"
    return True, f"{count} ready address(es)"


def ingress_host(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("ingress", check.name, _ns(check))
    if not obj:
        return False, "ingress not found"
    want = check.host or check.value
    for rule in kube.walk(obj, "spec", "rules") or []:
        if rule.get("host") == want:
            return True, want
    return False, f"host {want} not found"


def ingress_backend(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("ingress", check.name, _ns(check))
    if not obj:
        return False, "ingress not found"
    want = check.value or check.extra.get("service")
    for rule in kube.walk(obj, "spec", "rules") or []:
        for path in kube.walk(rule, "http", "paths") or []:
            svc = kube.walk(path, "backend", "service", "name")
            if svc == want:
                return True, f"backend {want}"
    return False, f"backend service {want} not referenced"


def networkpolicy_exists(check: Check) -> tuple[bool, str]:
    return resource_exists(
        Check(type="exists", kind="networkpolicy", name=check.name, namespace=_ns(check))
    )


def pvc_bound(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("pvc", check.name, _ns(check))
    if not obj:
        return False, "pvc not found"
    phase = str(kube.walk(obj, "status", "phase") or "")
    return phase == "Bound", f"phase={phase}"


def pvc_size(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("pvc", check.name, _ns(check))
    if not obj:
        return False, "pvc not found"
    got = str(kube.walk(obj, "spec", "resources", "requests", "storage") or "")
    want = check.value
    if want and not kube.qty_equal(got, want, "memory"):
        return False, f"storage={got} (want {want})"
    return True, got or "ok"


def pvc_access_mode(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("pvc", check.name, _ns(check))
    if not obj:
        return False, "pvc not found"
    modes = kube.walk(obj, "spec", "accessModes") or []
    want = check.value or "ReadWriteOnce"
    if want in modes:
        return True, want
    return False, f"accessModes={modes}"


def volume_mounted(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind or "pod", check.name, _ns(check))
    if not obj:
        return False, "not found"
    want = check.value or check.path or check.extra.get("claim")
    mounts = []
    for c in kube.containers_of(obj):
        for m in c.get("volumeMounts") or []:
            mounts.append(m)
            if m.get("name") == want or m.get("mountPath") == want:
                return True, m.get("mountPath") or m.get("name")
    vols = kube.walk(obj, "spec", "volumes") or kube.walk(
        obj, "spec", "template", "spec", "volumes"
    ) or []
    for vol in vols:
        claim = kube.walk(vol, "persistentVolumeClaim", "claimName")
        if claim == want:
            return True, f"claim {want}"
    return False, "volume not mounted"


def pod_on_node(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource("pod", check.name, _ns(check))
    if not obj:
        return False, "pod not found"
    got = str(kube.walk(obj, "spec", "nodeName") or "")
    want = kube.resolve_node(check.node or check.value)
    if want and got != want:
        return False, f"on {got or 'none'} (want {want})"
    if check.labels:
        node = kube.get_resource("node", got) if got else None
        labels = (node or {}).get("metadata", {}).get("labels") or {}
        for k, v in check.labels.items():
            if labels.get(k) != v:
                return False, f"node {got} missing {k}={v}"
    if got:
        return True, got
    return False, "not scheduled"


def pod_has_toleration(check: Check) -> tuple[bool, str]:
    obj = kube.get_resource(check.kind or "pod", check.name, _ns(check))
    if not obj:
        return False, "not found"
    tols = kube.walk(obj, "spec", "tolerations") or kube.walk(
        obj, "spec", "template", "spec", "tolerations"
    ) or []
    key = check.key or check.extra.get("key")
    for t in tols:
        if key and t.get("key") != key:
            continue
        if check.value and t.get("value") not in {check.value, None, ""}:
            if t.get("value") != check.value:
                continue
        if check.extra.get("effect") and t.get("effect") != check.extra.get("effect"):
            continue
        return True, f"tolerates {t.get('key')}"
    return False, f"no matching toleration for {key}"


def node_has_taint(check: Check) -> tuple[bool, str]:
    name = kube.resolve_node(check.node or check.name)
    node = kube.get_resource("node", name) if name else None
    if not node:
        return False, "node not found"
    for t in node.get("spec", {}).get("taints") or []:
        if t.get("key") == check.key:
            if check.value and t.get("value") != check.value:
                continue
            return True, f"{t.get('key')}={t.get('value')}:{t.get('effect')}"
    return False, f"taint {check.key} not found"


def node_unschedulable(check: Check) -> tuple[bool, str]:
    name = kube.resolve_node(check.node or check.name)
    node = kube.get_resource("node", name) if name else None
    if not node:
        return False, "node not found"
    unsched = bool(kube.walk(node, "spec", "unschedulable"))
    want = (check.value or "true").lower() != "false"
    return unsched == want, f"unschedulable={unsched}"


def file_exists(check: Check) -> tuple[bool, str]:
    path = Path(os.path.expanduser(check.path or check.value)).expanduser()
    if path.is_file():
        return True, str(path)
    return False, f"{path} not found"


def dir_exists(check: Check) -> tuple[bool, str]:
    path = Path(os.path.expanduser(check.path or check.value)).expanduser()
    if path.is_dir():
        return True, str(path)
    return False, f"{path} not found"


def ssh_reachable(check: Check) -> tuple[bool, str]:
    nodes = check.nodes or ([check.node] if check.node else ["node-01", "node-02", "node-03"])
    failed = [n for n in nodes if not ssh.reachable(n)]
    if failed:
        return False, "unreachable: " + ", ".join(failed)
    return True, ", ".join(nodes)


def systemd_active(check: Check) -> tuple[bool, str]:
    node = check.node or "worker-1"
    service = check.service or check.name or check.value
    out = ssh.on_node(node, f"systemctl is-active {service} || true").strip().splitlines()
    state = out[-1] if out else ""
    if state == "active":
        return True, f"{service} active on {node}"
    return False, f"{service} is {state or 'unknown'} on {node}"


def sysctl_eq(check: Check) -> tuple[bool, str]:
    node = check.node or "node-01"
    out = ssh.on_node(node, f"sysctl -n {check.key}").strip()
    if out == str(check.value):
        return True, f"{check.key}={out}"
    return False, f"{check.key}={out} (want {check.value})"


def disk_usage_below(check: Check) -> tuple[bool, str]:
    node = check.node or "worker-1"
    mount = check.path or "/"
    out = ssh.on_node(node, f"df --output=pcent {mount} | tail -1").strip().replace("%", "")
    try:
        used = int(out)
    except ValueError:
        return False, f"cannot parse df: {out}"
    limit = int(check.max or check.value or 90)
    if used > limit:
        return False, f"{mount} {used}% used (want <= {limit}%)"
    return True, f"{mount} {used}% used"


def snapshot_valid(check: Check) -> tuple[bool, str]:
    path = Path(os.path.expanduser(check.path or check.value)).expanduser()
    if not path.is_file() or path.stat().st_size < 100:
        return False, f"snapshot missing or empty: {path}"
    return True, f"{path} ({path.stat().st_size} bytes)"


def http_get(check: Check) -> tuple[bool, str]:
    url = check.url or check.value
    ns = _ns(check) or "default"
    image = str(check.extra.get("image") or "curlimages/curl:8.10.1")
    pod = f"labctl-probe-{os.getpid()}"
    args = [
        "run",
        pod,
        "-n",
        ns,
        "--rm",
        "--restart=Never",
        "--image",
        image,
        "--timeout=45s",
        "--",
        "curl",
        "-sS",
        "-o",
        "/dev/null",
        "-w",
        "%{http_code}",
        "--connect-timeout",
        "8",
        "--max-time",
        "20",
        url,
    ]
    try:
        out = kube.kubectl(*args, check=True).strip()
    except kube.KubeError as exc:
        kube.kubectl("delete", "pod", pod, "-n", ns, "--ignore-not-found", check=False)
        return False, str(exc)
    if out.endswith("000") or out == "000":
        return False, f"curl failed ({out})"
    code = out[-3:] if len(out) >= 3 else out
    if code.startswith("2") or code.startswith("3"):
        return True, f"HTTP {code}"
    return False, f"HTTP {code}"


def dns_resolves(check: Check) -> tuple[bool, str]:
    name = check.name or check.value or "kubernetes.default.svc.cluster.local"
    ns = _ns(check) or "default"
    pod = f"labctl-dns-{os.getpid()}"
    args = [
        "run",
        pod,
        "-n",
        ns,
        "--rm",
        "--restart=Never",
        "--image",
        "busybox:1.36",
        "--timeout=45s",
        "--",
        "nslookup",
        name,
    ]
    try:
        out = kube.kubectl(*args, check=True)
    except kube.KubeError as exc:
        kube.kubectl("delete", "pod", pod, "-n", ns, "--ignore-not-found", check=False)
        return False, str(exc)
    if "Name:" in out or "Address" in out:
        return True, name
    return False, "no DNS answer"


def workdir_file(check: Check) -> tuple[bool, str]:
    path = workdir() / (check.path or check.value)
    if path.is_file():
        return True, str(path)
    return False, f"{path} not found"


_HANDLERS: dict[str, Callable[[Check], tuple[bool, str]]] = {
    "cluster_healthy": cluster_healthy,
    "api_reachable": api_reachable,
    "kubernetes_version": kubernetes_version,
    "nodes_ready": nodes_ready,
    "node_count": node_count,
    "node_ready": node_is_ready,
    "node_not_ready": node_is_not_ready,
    "control_plane_healthy": control_plane_healthy,
    "etcd_healthy": etcd_healthy,
    "coredns_healthy": coredns_healthy,
    "cni_healthy": cni_healthy,
    "namespace_exists": namespace_exists,
    "namespace_absent": namespace_absent,
    "exists": resource_exists,
    "absent": resource_absent,
    "resource_absent": resource_absent,
    "pod_phase": pod_phase,
    "pod_running": pod_running,
    "pod_pending": pod_pending,
    "pod_image": pod_image,
    "pod_port": pod_port,
    "pod_resources": pod_resources,
    "restart_count": restart_count,
    "replicas": deployment_replicas,
    "deployment_replicas": deployment_replicas,
    "ready": deployment_ready,
    "deployment_ready": deployment_ready,
    "rollout_complete": rollout_complete,
    "replicaset_min": replicaset_min,
    "image": workload_image,
    "label": label_eq,
    "env": env_eq,
    "hasKey": has_key,
    "has_key": has_key,
    "env_from_configmap": env_from_configmap,
    "env_from_secret": env_from_secret,
    "service_type": service_type,
    "selector": service_selector,
    "service_selector": service_selector,
    "service_port": service_port,
    "endpoints": endpoints_populated,
    "endpoints_populated": endpoints_populated,
    "ingress_host": ingress_host,
    "ingress_backend": ingress_backend,
    "networkpolicy_exists": networkpolicy_exists,
    "pvc_bound": pvc_bound,
    "pvc_size": pvc_size,
    "pvc_access_mode": pvc_access_mode,
    "volume_mounted": volume_mounted,
    "pod_on_node": pod_on_node,
    "pod_has_toleration": pod_has_toleration,
    "node_has_taint": node_has_taint,
    "node_unschedulable": node_unschedulable,
    "file_exists": file_exists,
    "dir_exists": dir_exists,
    "ssh_reachable": ssh_reachable,
    "systemd_active": systemd_active,
    "sysctl": sysctl_eq,
    "disk_usage_below": disk_usage_below,
    "snapshot_valid": snapshot_valid,
    "http_get": http_get,
    "dns_resolves": dns_resolves,
    "workdir_file": workdir_file,
}
