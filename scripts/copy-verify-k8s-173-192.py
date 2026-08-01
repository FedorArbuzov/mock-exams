#!/usr/bin/env python3
"""Copy rendered 173-192 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("173 RBAC the permissions model in Kubernetes", "kubernetes-173-rbac-the-permissions-model-in-kubernetes"),
    ("174 Role vs ClusterRole", "kubernetes-174-role-vs-clusterrole"),
    ("175 RoleBinding vs ClusterRoleBinding", "kubernetes-175-rolebinding-vs-clusterrolebinding"),
    ("176 kubectl auth can-i quick access check", "kubernetes-176-kubectl-auth-can-i-quick-access-check"),
    ("177 ServiceAccount best practices", "kubernetes-177-serviceaccount-best-practices"),
    ("178 Secret why base64 is not encryption", "kubernetes-178-secret-why-base64-is-not-encryption"),
    ("179 Safe secret rotation (basics)", "kubernetes-179-safe-secret-rotation-basics"),
    ("180 ConfigMap vs Secret what goes where", "kubernetes-180-configmap-vs-secret-what-goes-where"),
    ("181 NetworkPolicy restrict east-west traffic", "kubernetes-181-networkpolicy-restrict-east-west-traffic"),
    ("182 Least privilege instead of admin", "kubernetes-182-least-privilege-instead-of-admin"),
    ("183 RBAC mistakes everyone makes", "kubernetes-183-rbac-mistakes-everyone-makes"),
    ("184 Pod Security Standards Privileged Baseline Restricted", "kubernetes-184-pod-security-standards-privileged-baseline-restricted"),
    ("185 Admission controllers webhooks (concept)", "kubernetes-185-admission-controllers-webhooks-concept"),
    ("186 Policy-as-code idea Kyverno OPA overview", "kubernetes-186-policy-as-code-idea-kyverno-opa-overview"),
    ("187 Basic threat thinking for k8s", "kubernetes-187-basic-threat-thinking-for-k8s"),
    ("188 Myth Namespace is not security isolation", "kubernetes-188-myth-namespace-is-not-security-isolation"),
    ("189 Myth a Secret in k8s is not a safe", "kubernetes-189-myth-a-secret-in-k8s-is-not-a-safe"),
    ("190 Security checklist before release", "kubernetes-190-security-checklist-before-release"),
    ("191 Security checklist after an incident", "kubernetes-191-security-checklist-after-an-incident"),
    ("192 Multi-tenancy namespace as a boundary", "kubernetes-192-multi-tenancy-namespace-as-a-boundary"),
]


def has_moov(p: Path) -> bool:
    data = p.read_bytes()[:200000] + p.read_bytes()[-200000:]
    return b"moov" in data


def main() -> None:
    ok = True
    for folder, name in MAP:
        src = OUT / f"{name}.mp4"
        if not src.exists():
            print(f"[MISS] {name}.mp4")
            ok = False
            continue
        dst = ROOT / "videos" / folder / "kubernetes-reel.mp4"
        dst.write_bytes(src.read_bytes())
        match = src.stat().st_size == dst.stat().st_size
        moov = has_moov(dst)
        flag = "OK" if (moov and match) else "FAIL"
        if flag != "OK":
            ok = False
        print(f"[{flag}] {folder}: {dst.stat().st_size / 1_000_000:.1f} MB  moov={moov} match={match}")
    print("ALL OK" if ok else "SOME FAILED")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
