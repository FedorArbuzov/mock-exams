import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Idempotency";

export const AUDIO_SRC = "audio/terraform/023-no-changes-idempotency-win.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.85;

export const HIGHLIGHT_WORDS = [
  "idempotency",
  "drift",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "no changes",
  chips: [
    "apply",
    "plan",
    "stable",
  ],
  lines: [
    "$ terraform apply",
    "$ terraform plan",
    "No changes.",
  ],
  bad: "always changing",
  good: "stable repeat",
  stamp: "BORING IS A WIN",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Why is a boring plan a huge win?" },
  { id: "explain", text: "After Terraform creates the desired infrastructure, running plan again should ideally report no changes. This is idempotency: repeating the same declaration produces the same desired result rather than making duplicates. It makes automation predictable and reveals when reality drifted from configuration." },
  { id: "detail", text: "Run plan after an apply and during routine checks. If Terraform shows unexpected changes, investigate configuration defaults, provider behavior, manual edits, and changing external values. Keep non-deterministic values out of resource arguments unless you intentionally want a change on every run." },
  { id: "pitfall", text: "No changes does not mean your application is healthy or your security posture is perfect. It only means Terraform sees no difference between its configuration, state, and provider's current view." },
  { id: "rule", text: "A repeat plan with no changes proves your infrastructure code is stable." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
