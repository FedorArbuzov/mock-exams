import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Provider lock file";

export const AUDIO_SRC = "audio/terraform/105-terraform-providers-lock.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.75;

export const HIGHLIGHT_WORDS = [
  "lock file",
  "checksums",
  "providers",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "LOCK",
  chips: [
    "constraint",
    "version",
    "checksum",
  ],
  lines: [
    ".terraform.lock.hcl",
    "selected provider hash",
  ],
  bad: "Different provider builds",
  good: "Verified shared selection",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A lock file makes provider selection reproducible across machines." },
  { id: "explain", text: "Terraform records selected provider versions and package checksums in .terraform.lock.hcl. Committing that file helps developers and CI use the same verified provider build for a configuration. It complements version constraints: constraints express what is allowed, while the lock records what was actually selected." },
  { id: "detail", text: "Review lock-file changes when providers are initialized or upgraded. Generate platform checksums when teams run Terraform on multiple operating systems and architectures. Keep the lock file with the root configuration that uses those providers. Use intentional upgrade commands instead of deleting it to chase a problem." },
  { id: "pitfall", text: "Ignoring the lock file can let different machines select different provider versions within a broad constraint. Deleting it may appear to fix initialization but removes reproducibility and checksum protection. Diagnose the constraint or registry issue, then update lock data intentionally." },
  { id: "rule", text: "Commit provider lock files and review every selection change." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
