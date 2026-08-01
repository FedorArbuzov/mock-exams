import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Skip Terraform";

export const AUDIO_SRC = "audio/terraform/009-when-you-do-not-need-terraform.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.90;

export const HIGHLIGHT_WORDS = [
  "judgment",
  "repeatability",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "always Terraform?",
  chips: [
    "repeat",
    "share",
    "manage",
  ],
  lines: [
    "one-time test",
    "repeatable env",
  ],
  bad: "tool worship",
  good: "fit the need",
  stamp: "AUTOMATE REPEATS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Is Terraform always the answer?" },
  { id: "explain", text: "Terraform is excellent for repeatable infrastructure, but not every cloud action deserves a module and state file. A one-time experiment, an emergency incident action, or a managed service setting used once may be faster in the console. The goal is reliable outcomes, not maximum Terraform coverage." },
  { id: "detail", text: "Use Terraform when an environment must be recreated, reviewed, shared, or kept consistent over time. Use a console or CLI for quick investigation, then decide whether that action should become declared infrastructure. If it matters again, capture it in code and import it carefully." },
  { id: "pitfall", text: "The common mistake is creating resources manually that later become permanent without documentation. The opposite mistake is building a complicated Terraform stack for a disposable ten-minute experiment that nobody will repeat." },
  { id: "rule", text: "Automate repeated infrastructure, not every single click you make." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
