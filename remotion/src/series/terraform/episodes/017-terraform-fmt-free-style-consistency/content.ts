import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Format Code";

export const AUDIO_SRC = "audio/terraform/017-terraform-fmt-free-style-consistency.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 63.38;

export const HIGHLIGHT_WORDS = [
  "fmt",
  "consistency",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "format for free",
  chips: [
    "clean",
    "consistent",
    "review",
  ],
  lines: [
    "$ terraform fmt",
    "$ terraform fmt -check",
  ],
  bad: "style debates",
  good: "standard format",
  stamp: "FORMAT BEFORE REVIEW",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Can Terraform fix your spacing for free?" },
  { id: "explain", text: "Terraform fmt rewrites Terraform files into Terraform's standard formatting style. It aligns common syntax, normalizes spacing, and reduces review noise caused by personal formatting preferences. It does not change what your infrastructure means, but it makes configuration easier to scan and compare." },
  { id: "detail", text: "Run terraform fmt before committing, or use terraform fmt -check in CI to detect unformatted files. Use terraform fmt -recursive when formatting a module tree. Configure your editor to format on save if your team agrees, then review the diff like any other change." },
  { id: "pitfall", text: "Formatting is not validation and cannot tell whether a resource argument is valid. Do not confuse a clean format result with a safe plan; run validate and inspect the plan as separate steps." },
  { id: "rule", text: "Format early so reviews discuss infrastructure, not whitespace." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
