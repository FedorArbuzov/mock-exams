import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "First Hour";

export const AUDIO_SRC = "audio/terraform/012-mini-checklist-first-terraform-hour.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 60.26;

export const HIGHLIGHT_WORDS = [
  "init",
  "plan",
  "destroy",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "first hour",
  chips: [
    "small",
    "safe",
    "repeat",
  ],
  lines: [
    "init",
    "plan",
    "apply",
    "destroy",
  ],
  bad: "start huge",
  good: "start small",
  stamp: "BUILD THE LOOP",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "What should you learn first?" },
  { id: "explain", text: "Your first Terraform hour should build a safe loop, not a huge cloud environment. Install the CLI, create a tiny folder, initialize it, format and validate the configuration, then read a plan. That sequence teaches the feedback loop you will use every day." },
  { id: "detail", text: "Start with a harmless local resource or a low-cost sandbox account. Keep provider credentials outside source files, run plan before apply, and destroy temporary resources when finished. Save the commands and lessons in a small README so your next project begins faster." },
  { id: "pitfall", text: "Starting with a production VPC or a large copy-pasted module hides the basics under too much complexity. A small resource is enough to learn initialization, state, planning, application, and cleanup." },
  { id: "rule", text: "Learn the safe loop on something small before managing something important." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
