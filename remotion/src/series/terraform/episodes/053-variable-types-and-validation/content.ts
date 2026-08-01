import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "types validation";

export const AUDIO_SRC = "audio/terraform/053-variable-types-and-validation.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.22;

export const HIGHLIGHT_WORDS = [
  "types",
  "validation",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "GUARD",
  chips: [
    "type",
    "rule",
    "message",
  ],
  lines: [
    "type = string",
  ],
  bad: "Any input",
  good: "Early error",
  stamp: "VALIDATE EARLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Reject bad inputs before they become bad infrastructure." },
  { id: "explain", text: "Variable type constraints tell Terraform what shape a caller must provide, including string, number, bool, list, set, map, object, and tuple. Validation rules add domain checks, such as allowed environments, CIDR format, or a minimum retention period." },
  { id: "detail", text: "Choose the narrowest type that represents the interface. Object types make required fields visible and allow module evolution with optional attributes. Write validation messages that explain how to correct the input, then test both accepted and rejected examples." },
  { id: "pitfall", text: "Validation cannot replace provider-side policy or runtime checks. A regex may accept an invalid cloud identifier, and a valid value may still be unauthorized. Avoid complex validation that duplicates every provider rule and becomes harder to maintain than the module." },
  { id: "rule", text: "Type inputs narrowly and validate the few rules callers must satisfy." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
