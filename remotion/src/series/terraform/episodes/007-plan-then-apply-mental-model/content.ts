import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Plan then Apply";

export const AUDIO_SRC = "audio/terraform/007-plan-then-apply-mental-model.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 62.64;

export const HIGHLIGHT_WORDS = [
  "plan",
  "apply",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "apply & hope?",
  chips: [
    "plan",
    "review",
    "apply",
  ],
  lines: [
    "$ terraform plan",
    "$ terraform apply",
  ],
  bad: "blind apply",
  good: "plan first",
  stamp: "PLAN = REVIEW",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Can I just run apply and hope?" },
  { id: "explain", text: "Terraform works in two useful steps. Plan compares your configuration with the real infrastructure and the saved state, then proposes changes. Apply carries out that approved change set. Thinking of plan as a review screen makes Terraform feel less like magic and more like a controlled deployment." },
  { id: "detail", text: "Run terraform plan whenever you change code or variables, and read every add, change, and destroy marker. When the output matches your intention, run terraform apply and confirm. In automated pipelines, save a reviewed plan file so the exact plan you reviewed is the plan applied." },
  { id: "pitfall", text: "Beginners often treat apply as a preview and discover a deletion too late. A plan is only a prediction, so changes made outside Terraform between plan and apply can still affect the final result." },
  { id: "rule", text: "Plan to understand change, then apply only what you intentionally reviewed." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
