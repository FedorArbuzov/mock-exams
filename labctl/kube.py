"""kubectl helpers. Talks to the real cluster — never a simulated API."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from typing import Any

from labctl.paths import kubeconfig_path


class KubeError(RuntimeError):
    pass


def _kubectl_bin() -> str:
    for name in ("kubectl", "kubectl.exe"):
        found = shutil.which(name)
        if found:
            return found
    raise KubeError("kubectl not found on PATH")


def kubectl(*args: str, check: bool = True, input_text: str | None = None) -> str:
    cmd = [_kubectl_bin()]
    cfg = kubeconfig_path()
    if cfg:
        cmd.extend(["--kubeconfig", cfg])
    cmd.extend(args)
    env = os.environ.copy()
    if cfg:
        env["KUBECONFIG"] = cfg
    proc = subprocess.run(
        cmd,
        input=input_text,
        text=True,
        capture_output=True,
        env=env,
        timeout=120,
    )
    if check and proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip()
        raise KubeError(err or f"kubectl {' '.join(args)} failed")
    return proc.stdout


def kubectl_ok(*args: str) -> bool:
    try:
        kubectl(*args, check=True)
        return True
    except KubeError:
        return False


def kubectl_json(*args: str) -> Any:
    out = kubectl(*args, "-o", "json")
    if not out.strip():
        return None
    return json.loads(out)


def current_context() -> str:
    try:
        return kubectl("config", "current-context", check=True).strip()
    except KubeError:
        return ""


def refuse_docker_desktop() -> None:
    ctx = current_context()
    if ctx == "docker-desktop":
        raise KubeError(
            "Current context is docker-desktop. This course needs the "
            "Kubespray lab cluster. export KUBECONFIG=$HOME/.kube/kuber-cka.conf"
        )


def api_reachable() -> bool:
    try:
        refuse_docker_desktop()
        kubectl("get", "--raw", "/readyz", check=True)
        return True
    except KubeError:
        try:
            kubectl("get", "ns", "default", check=True)
            return True
        except KubeError:
            return False


def get_resource(kind: str, name: str, namespace: str = "") -> dict[str, Any] | None:
    args = ["get", kind, name]
    if namespace:
        args.extend(["-n", namespace])
    try:
        data = kubectl_json(*args)
    except KubeError as exc:
        msg = str(exc).lower()
        if "not found" in msg:
            return None
        raise
    return data if isinstance(data, dict) else None


def list_resources(kind: str, namespace: str = "", selector: str = "") -> list[dict[str, Any]]:
    args = ["get", kind]
    if namespace:
        args.extend(["-n", namespace])
    else:
        args.append("-A")
    if selector:
        args.extend(["-l", selector])
    try:
        data = kubectl_json(*args)
    except KubeError:
        return []
    if not isinstance(data, dict):
        return []
    return [i for i in (data.get("items") or []) if isinstance(i, dict)]


def nodes() -> list[dict[str, Any]]:
    return list_resources("nodes", namespace="")


def node_names() -> list[str]:
    return [n.get("metadata", {}).get("name", "") for n in nodes() if n.get("metadata")]


def control_plane_names() -> list[str]:
    out = []
    for n in nodes():
        labels = n.get("metadata", {}).get("labels") or {}
        if any(
            k in labels
            for k in (
                "node-role.kubernetes.io/control-plane",
                "node-role.kubernetes.io/master",
            )
        ):
            name = n.get("metadata", {}).get("name")
            if name:
                out.append(name)
    return out


def worker_names() -> list[str]:
    cp = set(control_plane_names())
    return sorted(n for n in node_names() if n and n not in cp)


def resolve_node(alias: str) -> str:
    """Map worker-1 / node-02 style aliases to a live node name."""
    alias = (alias or "").strip()
    if not alias:
        return ""
    names = node_names()
    if alias in names:
        return alias
    workers = worker_names()
    mapping = {
        "worker-1": workers[0] if workers else "",
        "worker-2": workers[1] if len(workers) > 1 else "",
        "worker-3": workers[2] if len(workers) > 2 else "",
        "control-plane": (control_plane_names() or [""])[0],
        "cp": (control_plane_names() or [""])[0],
        "node-01": names[0] if names else "",
        "node-02": names[1] if len(names) > 1 else "",
        "node-03": names[2] if len(names) > 2 else "",
        "node-04": names[3] if len(names) > 3 else "",
    }
    if alias in mapping:
        return mapping[alias]
    lowered = {n.lower(): n for n in names}
    return lowered.get(alias.lower(), alias)


def node_ready(name: str) -> bool:
    node = get_resource("node", name)
    if not node:
        return False
    for cond in node.get("status", {}).get("conditions") or []:
        if cond.get("type") == "Ready":
            return cond.get("status") == "True"
    return False


def ready_node_count() -> int:
    return sum(1 for n in node_names() if node_ready(n))


def walk(obj: Any, *keys: str) -> Any:
    cur = obj
    for key in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur


def containers_of(obj: dict[str, Any]) -> list[dict[str, Any]]:
    spec = walk(obj, "spec", "containers")
    if isinstance(spec, list) and spec:
        return [c for c in spec if isinstance(c, dict)]
    tmpl = walk(obj, "spec", "template", "spec", "containers")
    if isinstance(tmpl, list):
        return [c for c in tmpl if isinstance(c, dict)]
    return []


def parse_cpu(value: str) -> float | None:
    if value is None or value == "":
        return None
    text = str(value).strip()
    try:
        if text.endswith("m"):
            return float(text[:-1]) / 1000.0
        if text.endswith("n"):
            return float(text[:-1]) / 1_000_000_000.0
        return float(text)
    except ValueError:
        return None


def parse_mem(value: str) -> float | None:
    if value is None or value == "":
        return None
    text = str(value).strip()
    units = {
        "Ki": 1024,
        "Mi": 1024**2,
        "Gi": 1024**3,
        "Ti": 1024**4,
        "K": 1000,
        "M": 1000**2,
        "G": 1000**3,
        "T": 1000**4,
        "k": 1000,
    }
    try:
        for suffix, mul in units.items():
            if text.endswith(suffix):
                return float(text[: -len(suffix)]) * mul
        return float(text)
    except ValueError:
        return None


def qty_equal(got: str, want: str, kind: str) -> bool:
    if not want:
        return True
    if kind == "cpu":
        a, b = parse_cpu(got), parse_cpu(want)
    else:
        a, b = parse_mem(got), parse_mem(want)
    if a is None or b is None:
        return str(got) == str(want)
    return abs(a - b) < 1e-6
