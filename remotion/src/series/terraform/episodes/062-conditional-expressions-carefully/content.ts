import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "conditionals";

export const AUDIO_SRC = "audio/terraform/062-conditional-expressions-carefully.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 67.75;

export const HIGHLIGHT_WORDS = [
  "conditionals",
  "lifecycle",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "IF",
  chips: [
    "bool",
    "types",
    "review",
  ],
  lines: [
    "var.enabled ? 1 : 0",
  ],
  bad: "Nested logic",
  good: "Named condition",
  stamp: "CHECK BOTH PATHS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A short conditional can quietly change a whole resource graph." },
  { id: "explain", text: "Terraform conditional expressions choose one value when a boolean condition is true and another when it is false. They work well for small, clear choices such as an instance type, optional tag, or feature flag. Both result branches must have compatible types." },
  { id: "detail", text: "Keep conditions readable by naming complex logic in locals. Use explicit booleans for features rather than magic environment comparisons scattered through resources. When conditionals control resource creation through count or for_each, review state identity and destroy behavior especially carefully." },
  { id: "pitfall", text: "A false condition can remove resources when it controls count, and an unknown condition can defer decisions to apply. Nested ternaries are difficult to review. Do not use a conditional merely to avoid modeling separate environments with genuinely different architecture." },
  { id: "rule", text: "Keep conditionals simple, typed, and obvious in their lifecycle effects." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
