import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "refresh only";

export const AUDIO_SRC = "audio/terraform/043-terraform-refresh-refresh-only.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.21;

export const HIGHLIGHT_WORDS = [
  "drift",
  "state",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "SYNC",
  chips: [
    "read",
    "plan",
    "state",
  ],
  lines: [
    "$ terraform plan -refresh-only",
  ],
  bad: "Blind apply",
  good: "Review drift",
  stamp: "READ REALITY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Refresh state without changing the real infrastructure." },
  { id: "explain", text: "Terraform refresh behavior reads provider data and updates state before planning by default. A refresh-only plan focuses on reconciling state with remote objects without proposing configuration changes. It is useful when the cloud changed outside Terraform and you need visibility." },
  { id: "detail", text: "Run terraform plan -refresh-only first to see proposed state updates. If the changes are expected, apply that refresh-only plan to persist them. This can reveal deleted resources, changed tags, or provider-computed values that no longer match state." },
  { id: "pitfall", text: "A refresh-only apply accepts remote reality into state. It does not restore your intended configuration. If someone changed a critical setting manually, refreshing first may hide the evidence you needed to understand why normal configuration now differs." },
  { id: "rule", text: "Plan refresh-only first, then apply only understood state updates." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
