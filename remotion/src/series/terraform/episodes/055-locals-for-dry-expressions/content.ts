import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "locals";

export const AUDIO_SRC = "audio/terraform/055-locals-for-dry-expressions.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.38;

export const HIGHLIGHT_WORDS = [
  "locals",
  "dry",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "DERIVE",
  chips: [
    "repeat",
    "name",
    "internal",
  ],
  lines: [
    "local.common_tags",
  ],
  bad: "Hidden knob",
  good: "Shared expression",
  stamp: "KEEP IT CLEAR",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Locals name repeated expressions without expanding your module API." },
  { id: "explain", text: "Local values assign names to expressions used repeatedly inside a module. They can combine variables, resource attributes, maps, and formatting into readable internal concepts. Locals reduce duplication while keeping callers from needing to understand every implementation detail." },
  { id: "detail", text: "Use locals for consistent tags, normalized names, derived maps, and shared conditions. Keep each local easy to trace back to inputs. A few meaningful locals clarify configuration; many chained locals can create a hidden programming language that is difficult to debug." },
  { id: "pitfall", text: "Locals are not mutable variables and cannot solve ordering problems. Avoid putting secret values into names or outputs through locals. If callers genuinely need to choose a value, use an input variable instead of a local with surprising hard-coded behavior." },
  { id: "rule", text: "Use locals for clear derived values, not hidden configuration knobs." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
