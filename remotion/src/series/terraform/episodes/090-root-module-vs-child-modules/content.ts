import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module structure";

export const AUDIO_SRC = "audio/terraform/090-root-module-vs-child-modules.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.12;

export const HIGHLIGHT_WORDS = [
  "root",
  "child",
  "backend",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "TREE",
  chips: [
    "root",
    "child",
    "resources",
  ],
  lines: [
    "root -> module call",
    "child -> AWS resources",
  ],
  bad: "Child owns backend",
  good: "Root owns context",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "The root decides where; child modules decide how." },
  { id: "explain", text: "The root module is the Terraform configuration you run from, usually for one environment or deployment boundary. It assembles providers, backend configuration, and child module calls. Child modules are reusable directories called by roots or other modules to implement a focused piece of infrastructure." },
  { id: "detail", text: "Keep environment-specific decisions, provider aliases, and state boundaries near the root. Keep reusable implementation details in child modules. This separation makes the same child module usable across development and production without forcing it to know account names, backend buckets, or organization-specific paths." },
  { id: "pitfall", text: "Putting backend configuration inside a reusable child module does not create separate state for each caller and misleads readers. Conversely, embedding production account decisions in a child module makes reuse brittle. Let the root own deployment context and the child own its implementation." },
  { id: "rule", text: "Roots own deployment context; children own reusable implementation." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
