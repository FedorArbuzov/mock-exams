import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Apply Safely";

export const AUDIO_SRC = "audio/terraform/021-terraform-apply-and-confirmation.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 60.05;

export const HIGHLIGHT_WORDS = [
  "apply",
  "confirmation",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "one last check",
  chips: [
    "plan",
    "confirm",
    "apply",
  ],
  lines: [
    "$ terraform apply",
    "Enter a value: yes",
  ],
  bad: "auto approve",
  good: "confirm intent",
  stamp: "PAUSE BEFORE CHANGE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Why does apply ask for confirmation?" },
  { id: "explain", text: "Terraform apply creates a plan and asks for confirmation before making changes in an interactive session. That pause gives you one final chance to notice unexpected creates, updates, or destroys. Once confirmed, Terraform calls provider APIs and writes the resulting state." },
  { id: "detail", text: "Use normal interactive apply while learning so you see the plan and confirmation prompt. In CI, apply a saved plan after a review and use non-interactive options only with deliberate safeguards. Watch the output for partial failures and never assume a failed apply changed nothing." },
  { id: "pitfall", text: "Using auto-approve from your first day removes an important safety checkpoint. It is also risky to rerun blindly after a failure; inspect the error, state, and new plan first." },
  { id: "rule", text: "Confirmation is a safety brake, not an annoying extra keystroke." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
