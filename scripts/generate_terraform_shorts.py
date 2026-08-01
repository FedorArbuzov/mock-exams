#!/usr/bin/env python3
"""Generate Terraform shorts scripts + Remotion episode stubs from catalog JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CTA = "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio."
CATALOG_GLOBS = [
    "terraform_catalog_07_40.json",
    "terraform_catalog_41_76.json",
    "terraform_catalog_77_112.json",
]

# Hand-authored episodes 1-6 (keep custom Remotion; still ensure script folders exist)
HAND = [
    {
        "n": 1,
        "title": "What is Terraform in 30 seconds",
        "topic": "What is Terraform",
        "slug_override": "001-what-is-terraform-in-30-seconds",
        "custom_remotion": True,
        "hook": "Everyone says use Terraform - what does it actually do?",
        "explain": "Terraform is Infrastructure as Code. You write configuration files, usually with a .tf extension, that describe the cloud resources you want. A provider plugin - AWS, Kubernetes, GitHub - turns that description into API calls.",
        "detail": "You do not invent a long bash script of creates. You declare the desired end state. Then you run terraform plan to preview creates, updates, and deletes, and terraform apply to execute that plan. The state file remembers which real IDs map to which blocks in your code.",
        "pitfall": "Beginners skip plan and treat apply like a deploy button. That is how surprises land in production. Make plan the review, apply the commit.",
        "rule": "Mental model: files describe intent, plan shows the diff, apply changes the world, state keeps the map.",
        "highlights": ["Terraform", "plan", "apply", "state", "provider"],
        "visual": {
            "mark": "IaC?",
            "chips": [".tf files", "provider", "cloud API"],
            "lines": ["$ terraform plan", "$ terraform apply"],
            "bad": "blind apply",
            "good": "plan first",
            "stamp": "PLAN THEN APPLY",
        },
    },
    {
        "n": 2,
        "title": "Why IaC beats ClickOps",
        "topic": "IaC vs ClickOps",
        "slug_override": "002-why-iac-beats-clickops",
        "custom_remotion": True,
        "hook": "Why not just click in the AWS Console?",
        "explain": "ClickOps is fine for a one-off experiment. The pain starts when you need the same VPC next week, or a teammate must rebuild what you clicked at midnight. Console clicks leave no reviewable history and no safe preview of blast radius.",
        "detail": "Infrastructure as Code puts the same resources in Git. A pull request shows the terraform plan: what will be created, changed, or destroyed. You can reject a bad change before apply. Rebuilds become reruns, not archaeology in the Console.",
        "pitfall": "Teams still ClickOps under pressure, then wonder why drift appears. If the Console is the source of truth, Terraform will fight you every plan.",
        "rule": "Rule: if you will create it twice, or share it with a teammate, put it in code first.",
        "highlights": ["ClickOps", "Console", "Git", "plan", "drift"],
        "visual": {
            "mark": "just click?",
            "chips": ["Console", "Git", "plan PR"],
            "lines": ["+ create", "~ change", "- destroy"],
            "bad": "ClickOps truth",
            "good": "code first",
            "stamp": "CODE FIRST",
        },
    },
    {
        "n": 3,
        "title": "Declarative desired state",
        "topic": "Desired State",
        "slug_override": "003-declarative-desired-state",
        "custom_remotion": True,
        "hook": "Do I write scripts that create a bucket step by step?",
        "explain": "No. Terraform is declarative. You describe the desired end state - this bucket exists, with these settings - not a procedural checklist of API calls. Terraform builds a graph, compares desired state to the state file and the live provider, and computes a diff.",
        "detail": "That is why a second apply with no code changes reports No changes. Idempotency is the goal. Imperative scripts often create duplicates unless you carefully code every if-exists branch yourself.",
        "pitfall": "Beginners mix mental models: they treat apply like a one-shot installer, then panic when a rename wants to destroy and recreate. Read the plan. The plan is the contract.",
        "rule": "Remember: you declare the destination; Terraform figures out the route.",
        "highlights": ["declarative", "desired state", "plan", "No changes"],
        "visual": {
            "mark": "step scripts?",
            "chips": ["desired", "diff", "No changes"],
            "lines": ["$ terraform apply", "No changes"],
            "bad": "one-shot apply",
            "good": "read the plan",
            "stamp": "DECLARE DESTINATION",
        },
    },
    {
        "n": 4,
        "title": "HCL in plain words",
        "topic": "HCL Basics",
        "slug_override": "004-hcl-in-plain-words",
        "custom_remotion": True,
        "hook": "Is HCL another programming language I must master?",
        "explain": "HCL - HashiCorp Configuration Language - is a config language, not a general-purpose app language. You write blocks: terraform, provider, resource, variable, output. Inside blocks you set arguments and use expressions for references and simple logic.",
        "detail": "A resource looks like: resource type in quotes, local name in quotes, then a body of arguments. Humans can read it in a pull request. Terraform can parse it into a graph. You will learn functions and for expressions over time - day one is blocks and references.",
        "pitfall": "Beginners paste giant dynamic blocks before they understand a flat resource. Start boring. One resource, clear names, then locals when repetition hurts.",
        "rule": "Habit: if a junior cannot skim your HCL in a PR, simplify the blocks before you add cleverness.",
        "highlights": ["HCL", "blocks", "resource", "provider"],
        "visual": {
            "mark": "new language?",
            "chips": ["terraform", "provider", "resource"],
            "lines": ['resource "aws_s3_bucket" "app" {', "  bucket = name", "}"],
            "bad": "clever HCL",
            "good": "readable PR",
            "stamp": "KEEP HCL SKIMMABLE",
        },
    },
    {
        "n": 5,
        "title": "Providers - plugins that talk to clouds",
        "topic": "Providers",
        "slug_override": "005-providers-plugins-that-talk-to-clouds",
        "custom_remotion": True,
        "hook": "How does Terraform know how to call AWS?",
        "explain": "Terraform core does not hardcode every cloud API. A provider is a plugin - hashicorp slash aws, kubernetes, random - that registers resource types and talks to the real API. Your configuration declares required_providers, then a provider block with region and other settings.",
        "detail": "terraform init downloads those plugins and records versions in the lock file. Without init, plan cannot even start. Pin versions so yesterday's green plan does not surprise you after a major provider bump.",
        "pitfall": "Beginners commit code without required_providers and wonder why a teammate's machine invents a different plugin version. Lock what works.",
        "rule": "Rule: core orchestrates; providers implement; init installs the contract.",
        "highlights": ["provider", "init", "lock file", "AWS", "plugin"],
        "visual": {
            "mark": "call AWS how?",
            "chips": ["core", "provider", "API"],
            "lines": ["$ terraform init", "providers lock"],
            "bad": "unpinned plugin",
            "good": "lock versions",
            "stamp": "INIT INSTALLS CONTRACT",
        },
    },
    {
        "n": 6,
        "title": "Resources vs data sources",
        "topic": "Resource vs Data",
        "slug_override": "006-resources-vs-data-sources",
        "custom_remotion": True,
        "hook": "When do I use resource and when data?",
        "explain": "A resource block means Terraform manages the lifecycle - create, update, delete - and tracks it in state. A data source means read-only lookup of something that already exists: an AMI, a VPC you did not create in this stack, an IAM policy document.",
        "detail": "Use data when you need an ID or attribute from outside your ownership boundary. Use resource when this configuration is responsible for the object. Mixing them wrong causes either orphaned Console objects or accidental destroys of shared infrastructure.",
        "pitfall": "Beginners data-source everything to feel safer, then never own a clean stack. Others resource-copy shared VPCs into every root module and create five networks named almost the same.",
        "rule": "Rule: resource owns; data observes; never destroy what you only meant to read.",
        "highlights": ["resource", "data", "state", "destroy"],
        "visual": {
            "mark": "resource or data?",
            "chips": ["resource owns", "data reads", "state tracks"],
            "lines": ['resource "..." "x" {}', 'data "..." "y" {}'],
            "bad": "destroy shared",
            "good": "data observes",
            "stamp": "OWN VS OBSERVE",
        },
    },
]


def slugify(n: int, title: str) -> str:
    s = title.lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return f"{n:03d}-{s}"


def folder_title(title: str) -> str:
    """Windows-safe lesson folder title (no <>:\"/\\|?*)."""
    s = title.replace(":", " -").replace("*", "star").replace("?", "")
    s = re.sub(r'[<>"/\\|]+', "-", s)
    s = re.sub(r"\s+", " ", s).strip(" .-")
    return s


def ts_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def script_text(ep: dict) -> str:
    parts = [ep["hook"], "", ep["explain"], "", ep["detail"], "", ep["pitfall"], "", ep["rule"], "", CTA, ""]
    return "\n".join(parts)


def content_ts(ep: dict, slug: str) -> str:
    v = ep["visual"]
    highlights = ",\n  ".join(f'"{ts_escape(h)}"' for h in ep["highlights"])
    chips = ",\n    ".join(f'"{ts_escape(c)}"' for c in v["chips"])
    lines = ",\n    ".join(f'"{ts_escape(c)}"' for c in v["lines"])
    return f'''import type {{SceneScript}} from "../../../../shared/types";
import type {{TerraformVisual}} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "{ts_escape(ep["topic"])}";

export const AUDIO_SRC = "audio/terraform/{slug}.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70;

export const HIGHLIGHT_WORDS = [
  {highlights},
] as const;

export const VISUAL: TerraformVisual = {{
  mark: "{ts_escape(v["mark"])}",
  chips: [
    {chips},
  ],
  lines: [
    {lines},
  ],
  bad: "{ts_escape(v["bad"])}",
  good: "{ts_escape(v["good"])}",
  stamp: "{ts_escape(v["stamp"])}",
}};

export const SCENE_SCRIPTS: SceneScript[] = [
  {{ id: "question", text: "{ts_escape(ep["hook"])}" }},
  {{ id: "explain", text: "{ts_escape(ep["explain"])}" }},
  {{ id: "detail", text: "{ts_escape(ep["detail"])}" }},
  {{ id: "pitfall", text: "{ts_escape(ep["pitfall"])}" }},
  {{ id: "rule", text: "{ts_escape(ep["rule"])}" }},
  {{ id: "cta", text: "{CTA}" }},
];
'''


def reel_ts() -> str:
    return '''import {createTerraformReel} from "../../templates/createTerraformReel";
import * as content from "./content";

export const Reel = createTerraformReel(content);
'''


def remotion_prompt(ep: dict) -> str:
    return f"""Terraform short {ep["n"]}: {ep["title"]}

TopicBanner: {ep["topic"]}
Uses shared templates (Hook / Chips / Code / Contrast / Rule) + CTAScene.
Visual: {json.dumps(ep["visual"], ensure_ascii=True)}
"""


def load_catalog() -> list[dict]:
    eps = list(HAND)
    seen = {e["n"] for e in eps}
    for name in CATALOG_GLOBS:
        path = ROOT / "scripts" / name
        if not path.exists():
            raise FileNotFoundError(path)
        data = json.loads(path.read_text(encoding="utf-8"))
        for ep in data:
            n = int(ep["n"])
            if n in seen:
                continue
            ep["custom_remotion"] = False
            eps.append(ep)
            seen.add(n)
    eps.sort(key=lambda e: e["n"])
    return eps


def write_index(eps: list[dict]) -> None:
    lines = [
        'import type {EpisodeConfig} from "../../../shared/types";',
        "",
    ]
    entries = []
    for ep in eps:
        slug = ep.get("slug_override") or slugify(ep["n"], ep["title"])
        var = f"ep{ep['n']:03d}"
        reel = f"Ep{ep['n']:03d}Reel"
        lines.append(f'import * as {var} from "./{slug}/content";')
        lines.append(f'import {{Reel as {reel}}} from "./{slug}/Reel";')
        entries.append(
            "  {\n"
            f'    id: "terraform-{slug}",\n'
            f"    component: {reel},\n"
            f"    audioSrc: {var}.AUDIO_SRC,\n"
            f"    audioDurationInSeconds: {var}.AUDIO_DURATION_SECONDS,\n"
            "  },"
        )
    lines.append("")
    lines.append("export const terraformEpisodes: EpisodeConfig[] = [")
    lines.extend(entries)
    lines.append("];")
    lines.append("")
    out = ROOT / "remotion" / "src" / "series" / "terraform" / "episodes" / "index.ts"
    out.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    eps = load_catalog()
    if len(eps) < 112:
        missing = sorted(set(range(1, 113)) - {e["n"] for e in eps})
        raise SystemExit(f"Expected 112 episodes, got {len(eps)}. Missing: {missing[:20]}...")

    for ep in eps:
        n = ep["n"]
        title = ep["title"]
        slug = ep.get("slug_override") or slugify(n, title)
        folder = ROOT / "videos-terraform" / f"{n} {folder_title(title)}"
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "audio").mkdir(exist_ok=True)
        (folder / "script.txt").write_text(script_text(ep), encoding="utf-8")
        (folder / "remotion-prompt.md").write_text(remotion_prompt(ep), encoding="utf-8")

        if ep.get("custom_remotion"):
            # Keep hand-built scenes; only refresh content.ts SCENE texts if file exists
            continue

        ep_dir = ROOT / "remotion" / "src" / "series" / "terraform" / "episodes" / slug
        ep_dir.mkdir(parents=True, exist_ok=True)
        (ep_dir / "content.ts").write_text(content_ts(ep, slug), encoding="utf-8")
        (ep_dir / "Reel.tsx").write_text(reel_ts(), encoding="utf-8")

    write_index(eps)
    print(f"Generated {len(eps)} episode scripts; template remotion for non-custom.")


if __name__ == "__main__":
    main()
