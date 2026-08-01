import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Healthy Project";

export const AUDIO_SRC = "audio/terraform/024-mini-checklist-healthy-first-project.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 62.71;

export const HIGHLIGHT_WORDS = [
  "checklist",
  "reproducible",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "healthy project",
  chips: [
    "safe",
    "clear",
    "repeatable",
  ],
  lines: [
    "fmt",
    "validate",
    "plan",
    "README",
  ],
  bad: "works once",
  good: "reproducible",
  stamp: "SAFE TO REPEAT",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "What makes a first project healthy?" },
  { id: "explain", text: "A healthy first Terraform project is small, formatted, validated, and safe to destroy. It declares versions, keeps credentials out of code, uses a sandbox account, and produces a clear plan. It also has a README that explains how to initialize, plan, apply, and clean up." },
  { id: "detail", text: "Check that terraform fmt -check and terraform validate pass, then review a plan with no surprises. Commit configuration and the dependency lock file, but ignore local state and secret variable files. Add tags or names so you can find every practice resource later." },
  { id: "pitfall", text: "A project is not healthy just because apply succeeded once on one laptop. If another person cannot initialize it safely, understand its variables, and destroy its test resources, the project still needs work." },
  { id: "rule", text: "A good first project is reproducible, reviewable, and easy to remove." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
