"""Node-level commands via Ansible, SSH, or lxc exec."""

from __future__ import annotations

import os
import shutil
import subprocess

from labctl import kube
from labctl.paths import workdir


class SSHError(RuntimeError):
    pass


def _inventory_dir() -> str | None:
    for candidate in (
        workdir() / "inventory",
        workdir() / "kubespray" / "inventory" / "lab",
    ):
        if candidate.is_dir():
            return str(candidate)
    return None


def on_node(node: str, command: str, timeout: int = 60) -> str:
    """Run a command as root on a cluster node. node may be an alias."""
    resolved = kube.resolve_node(node) or node
    ansible = shutil.which("ansible")
    inv = _inventory_dir()
    if ansible and inv:
        proc = subprocess.run(
            [
                ansible,
                resolved,
                "-b",
                "-m",
                "shell",
                "-a",
                command,
                "-i",
                inv,
            ],
            text=True,
            capture_output=True,
            timeout=timeout,
            env={**os.environ, "ANSIBLE_HOST_KEY_CHECKING": "False"},
        )
        if proc.returncode == 0:
            return proc.stdout
    lxc = shutil.which("lxc") or shutil.which("incus")
    if lxc:
        proc = subprocess.run(
            [lxc, "exec", resolved, "--", "bash", "-lc", command],
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        if proc.returncode == 0:
            return proc.stdout
    ip = _node_ip(resolved)
    if not ip:
        raise SSHError(f"cannot reach node {node!r} (resolved {resolved!r})")
    user = os.environ.get("CKA_SSH_USER") or os.environ.get("LABCTL_SSH_USER") or "ubuntu"
    key = os.environ.get("CKA_SSH_KEY") or os.environ.get("LABCTL_SSH_KEY")
    ssh = shutil.which("ssh")
    if not ssh:
        raise SSHError("ssh not found and ansible/lxc exec failed")
    cmd = [
        ssh,
        "-o",
        "BatchMode=yes",
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "ConnectTimeout=8",
    ]
    if key:
        cmd.extend(["-i", key])
    cmd.append(f"{user}@{ip}")
    cmd.append(f"sudo bash -lc { _shell_quote(command) }")
    proc = subprocess.run(cmd, text=True, capture_output=True, timeout=timeout)
    if proc.returncode != 0:
        raise SSHError((proc.stderr or proc.stdout or f"ssh {resolved} failed").strip())
    return proc.stdout


def reachable(node: str) -> bool:
    try:
        on_node(node, "true", timeout=15)
        return True
    except (SSHError, subprocess.TimeoutExpired, FileNotFoundError):
        return False


def _node_ip(name: str) -> str:
    node = kube.get_resource("node", name)
    if node:
        for addr in node.get("status", {}).get("addresses") or []:
            if addr.get("type") == "InternalIP":
                return str(addr.get("address") or "")
    defaults = {
        "node-01": "192.168.56.10",
        "node-02": "192.168.56.11",
        "node-03": "192.168.56.12",
        "node-04": "192.168.56.13",
    }
    return defaults.get(name, "")


def _shell_quote(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"
