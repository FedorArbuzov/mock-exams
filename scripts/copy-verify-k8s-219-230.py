#!/usr/bin/env python3
"""Copy rendered 219-230 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("219 Helm why you need it on top of YAML", "kubernetes-219-helm-why-you-need-it-on-top-of-yaml"),
    ("220 What a chart and a release are", "kubernetes-220-what-a-chart-and-a-release-are"),
    ("221 Chart structure templates, values, Chart.yaml", "kubernetes-221-chart-structure-templates-values-chart-yaml"),
    ("222 values.yaml managing environments", "kubernetes-222-values-yaml-managing-environments"),
    ("223 helm install first release", "kubernetes-223-helm-install-first-release"),
    ("224 helm upgrade updates", "kubernetes-224-helm-upgrade-updates"),
    ("225 helm rollback rollback", "kubernetes-225-helm-rollback-rollback"),
    ("226 helm history release revisions", "kubernetes-226-helm-history-release-revisions"),
    ("227 Environment variables through values", "kubernetes-227-environment-variables-through-values"),
    ("228 Common templating mistakes", "kubernetes-228-common-templating-mistakes"),
    ("229 Helm + CICD basic scenario", "kubernetes-229-helm-cicd-basic-scenario"),
    ("230 Checklist chart ready for prod", "kubernetes-230-checklist-chart-ready-for-prod"),
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
