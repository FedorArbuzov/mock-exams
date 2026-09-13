"""Setup / cleanup operations against the real cluster and Linux nodes."""

from __future__ import annotations

import time
from pathlib import Path

from labctl import kube, ssh
from labctl.models import Action
from labctl.paths import courses_dir


class ActionError(RuntimeError):
    pass


def run_action(action: Action) -> None:
    handler = _HANDLERS.get(action.op)
    if handler is None:
        raise ActionError(f"unknown op {action.op!r}")
    handler(action)


def run_all(actions: list[Action]) -> None:
    for action in actions:
        run_action(action)


def _course_file(rel: str) -> Path:
    if not rel:
        raise ActionError("file/manifest is required")
    path = Path(rel)
    if path.is_file():
        return path
    course = courses_dir()
    for candidate in (course / rel, course / "manifests" / rel, course / "app" / rel):
        if candidate.is_file():
            return candidate
    raise ActionError(f"manifest not found: {rel}")


def ensure_namespace(action: Action) -> None:
    name = action.name or action.namespace
    manifest = f"apiVersion: v1\nkind: Namespace\nmetadata:\n  name: {name}\n"
    kube.kubectl("apply", "-f", "-", input_text=manifest)


def delete_namespace(action: Action) -> None:
    name = action.name or action.namespace
    kube.kubectl("delete", "namespace", name, "--ignore-not-found", "--wait=false", check=False)
    # do not block forever on terminating namespaces
    deadline = time.time() + 45
    while time.time() < deadline:
        if kube.get_resource("namespace", name) is None:
            return
        time.sleep(1)


def apply_manifest(action: Action) -> None:
    path = _course_file(action.file)
    args = ["apply", "-f", str(path)]
    ns = action.namespace
    if ns:
        args.extend(["-n", ns])
    kube.kubectl(*args)


def delete_resource(action: Action) -> None:
    args = ["delete", action.kind, action.name, "--ignore-not-found"]
    if action.namespace:
        args.extend(["-n", action.namespace])
    kube.kubectl(*args, check=False)


def wait_ready(action: Action) -> None:
    kind = action.kind or "pod"
    name = action.name
    ns = action.namespace or "default"
    timeout = str(action.extra.get("timeout") or "120s")
    if kind.lower() in {"pod", "pods"}:
        kube.kubectl(
            "wait",
            "--for=condition=Ready",
            f"pod/{name}",
            "-n",
            ns,
            f"--timeout={timeout}",
            check=False,
        )
        return
    kube.kubectl(
        "rollout",
        "status",
        f"{kind}/{name}",
        "-n",
        ns,
        f"--timeout={timeout}",
        check=False,
    )


def sleep_op(action: Action) -> None:
    seconds = float(action.value or action.extra.get("seconds") or 2)
    time.sleep(seconds)


def kubectl_raw(action: Action) -> None:
    kube.kubectl(*action.args)


def ssh_cmd(action: Action) -> None:
    ssh.on_node(action.node, action.command)


def stop_service(action: Action) -> None:
    node = action.node or "worker-1"
    svc = action.service or action.name
    ssh.on_node(node, f"systemctl stop {svc}")


def start_service(action: Action) -> None:
    node = action.node or "worker-1"
    svc = action.service or action.name
    ssh.on_node(node, f"systemctl enable --now {svc}")


def label_node(action: Action) -> None:
    node = kube.resolve_node(action.node or action.name)
    kube.kubectl("label", "node", node, f"{action.key}={action.value}", "--overwrite")


def unlabel_node(action: Action) -> None:
    node = kube.resolve_node(action.node or action.name)
    kube.kubectl("label", "node", node, f"{action.key}-", check=False)


def taint_node(action: Action) -> None:
    node = kube.resolve_node(action.node or action.name)
    effect = action.effect or action.extra.get("effect") or "NoSchedule"
    kube.kubectl(
        "taint",
        "node",
        node,
        f"{action.key}={action.value}:{effect}",
        "--overwrite",
    )


def untaint_node(action: Action) -> None:
    node = kube.resolve_node(action.node or action.name)
    effect = action.effect or action.extra.get("effect") or "NoSchedule"
    kube.kubectl("taint", "node", node, f"{action.key}={action.value}:{effect}-", check=False)


def cordon(action: Action) -> None:
    node = kube.resolve_node(action.node or action.name)
    kube.kubectl("cordon", node)


def uncordon(action: Action) -> None:
    node = kube.resolve_node(action.node or action.name)
    kube.kubectl("uncordon", node, check=False)


def fill_disk(action: Action) -> None:
    node = action.node or "worker-1"
    path = action.extra.get("path") or "/var/tmp/labctl-fill"
    size = action.extra.get("size") or "2G"
    ssh.on_node(node, f"mkdir -p $(dirname {path}) && fallocate -l {size} {path} || dd if=/dev/zero of={path} bs=1M count=1024")


def unfill_disk(action: Action) -> None:
    node = action.node or "worker-1"
    path = action.extra.get("path") or "/var/tmp/labctl-fill"
    ssh.on_node(node, f"rm -f {path}")


def set_sysctl(action: Action) -> None:
    node = action.node or "node-01"
    ssh.on_node(node, f"sysctl -w {action.key}={action.value}")


def tc_delay(action: Action) -> None:
    node = action.node or "control-plane"
    dev = action.extra.get("dev") or "eth0"
    delay = action.value or action.extra.get("delay") or "2500ms"
    ssh.on_node(node, f"tc qdisc replace dev {dev} root netem delay {delay}")


def tc_clear(action: Action) -> None:
    node = action.node or "control-plane"
    dev = action.extra.get("dev") or "eth0"
    ssh.on_node(node, f"tc qdisc del dev {dev} root || true")


def restore_nodes(action: Action) -> None:
    for name in kube.node_names():
        kube.kubectl("uncordon", name, check=False)
        labels = action.extra.get("clear_labels") or ["cka-lab", "disk", "ssd"]
        for key in labels:
            kube.kubectl("label", "node", name, f"{key}-", check=False)
        taints = action.extra.get("clear_taints") or ["cka-lab=true:NoSchedule"]
        for t in taints:
            kube.kubectl("taint", "node", name, f"{t}-", check=False)
    for worker in kube.worker_names():
        try:
            ssh.on_node(worker, "systemctl enable --now kubelet containerd || true")
            ssh.on_node(worker, "rm -f /var/tmp/labctl-fill")
            ssh.on_node(worker, "sysctl -w net.ipv4.ip_forward=1 || true")
        except ssh.SSHError:
            continue
    for cp in kube.control_plane_names():
        try:
            ssh.on_node(cp, "tc qdisc del dev eth0 root || true")
            ssh.on_node(cp, "systemctl enable --now kubelet containerd || true")
        except ssh.SSHError:
            continue


def scale(action: Action) -> None:
    ns = action.namespace or "default"
    replicas = action.value or action.extra.get("replicas") or "1"
    kube.kubectl("scale", f"{action.kind}/{action.name}", f"--replicas={replicas}", "-n", ns)


def patch(action: Action) -> None:
    args = ["patch", action.kind, action.name]
    if action.namespace:
        args.extend(["-n", action.namespace])
    ptype = action.extra.get("type") or "merge"
    args.extend(["--type", ptype, "-p", action.value or action.extra.get("patch") or "{}"])
    kube.kubectl(*args)


def backup_configmap(action: Action) -> None:
    obj = kube.get_resource("configmap", action.name, action.namespace)
    if not obj:
        return
    dest = Path.home() / ".labctl" / "backups" / f"{action.namespace}-{action.name}.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    import json

    dest.write_text(json.dumps(obj), encoding="utf-8")


_HANDLERS = {
    "ensure_namespace": ensure_namespace,
    "ensureNamespace": ensure_namespace,
    "delete_namespace": delete_namespace,
    "deleteNamespace": delete_namespace,
    "apply": apply_manifest,
    "delete": delete_resource,
    "wait": wait_ready,
    "sleep": sleep_op,
    "kubectl": kubectl_raw,
    "ssh": ssh_cmd,
    "stop_service": stop_service,
    "start_service": start_service,
    "label_node": label_node,
    "unlabel_node": unlabel_node,
    "taint_node": taint_node,
    "untaint_node": untaint_node,
    "cordon": cordon,
    "uncordon": uncordon,
    "fill_disk": fill_disk,
    "unfill_disk": unfill_disk,
    "set_sysctl": set_sysctl,
    "tc_delay": tc_delay,
    "tc_clear": tc_clear,
    "restore_nodes": restore_nodes,
    "scale": scale,
    "patch": patch,
    "backup_configmap": backup_configmap,
}
