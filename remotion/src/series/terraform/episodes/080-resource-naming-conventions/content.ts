import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Naming";

export const AUDIO_SRC = "audio/terraform/080-resource-naming-conventions.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.94;

export const HIGHLIGHT_WORDS = [
  "locals",
  "environment",
  "readability",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "NAME",
  chips: [
    "app",
    "env",
    "purpose",
  ],
  lines: [
    "name = \"api-prod-cache\"",
    "local.prefix = \"api-prod\"",
  ],
  bad: "api-final-v2",
  good: "api-prod-cache",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Good names make a console search feel like a query, not archaeology." },
  { id: "explain", text: "A naming convention turns anonymous cloud objects into understandable infrastructure. Include stable dimensions such as application, environment, region, and purpose when they help operators distinguish resources. Build names from Terraform locals so every resource follows one pattern and changes are deliberate rather than scattered." },
  { id: "detail", text: "Respect service limits and immutable naming rules before standardizing. Some names must be globally unique, some cannot be renamed, and some allow only certain characters. Prefer readable names over clever abbreviations. Keep a separate immutable identifier when a friendly display name may need to change later." },
  { id: "pitfall", text: "Putting volatile details like ticket numbers or deployment timestamps into durable resource names causes replacement, noise, and confusion. Names also become dangerous when they encode secrets or personal data. Use tags for rich metadata and names for concise identification." },
  { id: "rule", text: "Use stable, readable names assembled from shared locals." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
