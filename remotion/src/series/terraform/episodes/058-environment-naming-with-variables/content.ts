import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "environment names";

export const AUDIO_SRC = "audio/terraform/058-environment-naming-with-variables.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.37;

export const HIGHLIGHT_WORDS = [
  "environment",
  "naming",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "NAME",
  chips: [
    "env",
    "prefix",
    "tags",
  ],
  lines: [
    "name = \"${var.env}-api\"",
  ],
  bad: "Manual names",
  good: "One variable",
  stamp: "NAME CONSISTENTLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A consistent name makes resources searchable and safer." },
  { id: "explain", text: "An environment variable, such as dev, stage, or prod, can drive resource names, tags, paths, and feature choices. Used consistently, it makes ownership and cost allocation easier. It should be validated so unexpected spellings do not create accidental environments." },
  { id: "detail", text: "Define a small allowed environment set, derive a shared name prefix in locals, and add standard tags for environment, application, and owner. Keep account and backend selection separate from a name string, because tags alone do not enforce isolation." },
  { id: "pitfall", text: "Putting environment names everywhere by hand causes drift, truncation problems, and inconsistent tag values. Do not derive sensitive account details from a loose string. A typo like prdo can create a new resource name rather than safely targeting production." },
  { id: "rule", text: "Validate one environment input and derive names and tags centrally." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
