import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Terraform basics";

export const AUDIO_SRC = "audio/terraform/111-interview-explain-plan-vs-apply-vs-state.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.43;

export const HIGHLIGHT_WORDS = [
  "plan",
  "apply",
  "state",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "CORE",
  chips: [
    "config",
    "plan",
    "apply",
  ],
  lines: [
    "config + state -> plan",
    "apply -> cloud + state",
  ],
  bad: "State is optional cache",
  good: "State tracks identity",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "If you can explain these three, you can explain Terraform's core loop." },
  { id: "explain", text: "Terraform configuration describes desired infrastructure. The state records Terraform's current mapping between configuration addresses and real remote objects. Plan compares desired configuration, current state, and provider observations to propose actions. Apply executes the approved plan by calling providers and then updates state with the result." },
  { id: "detail", text: "A strong explanation notes that state is not merely a cache; it tracks identity and dependencies, so protect and back it up. Plan is a preview, not a guarantee if the world changes before apply. Apply changes real infrastructure, which is why review, locking, and credentials matter." },
  { id: "pitfall", text: "Saying Terraform always knows reality is inaccurate because remote changes and provider reads can differ over time. Saying plan changes nothing is mostly true but ignores reads and backend interactions. Explain the distinction clearly and mention controlled execution in shared environments." },
  { id: "rule", text: "Configuration declares, plan previews, apply changes, and state records identity." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
