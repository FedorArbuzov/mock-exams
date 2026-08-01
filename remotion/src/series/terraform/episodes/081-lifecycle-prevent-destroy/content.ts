import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Lifecycle";

export const AUDIO_SRC = "audio/terraform/081-lifecycle-prevent-destroy.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.80;

export const HIGHLIGHT_WORDS = [
  "lifecycle",
  "deletion",
  "safety",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "STOP",
  chips: [
    "database",
    "prod",
    "guard",
  ],
  lines: [
    "lifecycle {",
    "prevent_destroy = true",
  ],
  bad: "Destroy production DB",
  good: "Plan fails safely",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Some resources should refuse deletion even when your plan asks nicely." },
  { id: "explain", text: "The lifecycle prevent_destroy setting makes Terraform fail a plan that would destroy the protected resource. Use it for critical databases, production buckets, or other assets where accidental deletion is unacceptable. It is a safety rail inside configuration, not a backup or recovery strategy." },
  { id: "detail", text: "Apply it selectively to resources with high deletion impact and document why it exists. A future intentional replacement requires changing configuration or moving state with care, so teams must understand the tradeoff. Pair protection with backups, recovery testing, and access controls because prevention cannot cover every failure path." },
  { id: "pitfall", text: "Adding prevent_destroy everywhere makes routine refactoring painful and encourages people to remove safety settings blindly. It also does not stop deletion performed outside Terraform. Protect the few resources where an accidental destroy would be materially costly." },
  { id: "rule", text: "Protect high-impact resources, then maintain tested recovery paths." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
