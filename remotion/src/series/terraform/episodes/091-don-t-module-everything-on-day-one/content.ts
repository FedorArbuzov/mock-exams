import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module design";

export const AUDIO_SRC = "audio/terraform/091-don-t-module-everything-on-day-one.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.04;

export const HIGHLIGHT_WORDS = [
  "abstraction",
  "duplication",
  "evolution",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "WAIT",
  chips: [
    "direct",
    "repeat",
    "extract",
  ],
  lines: [
    "First: resources",
    "Later: shared module",
  ],
  bad: "Module every file",
  good: "Module proven pattern",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "An abstraction before repetition is often just a maze." },
  { id: "explain", text: "Start with direct resources when a configuration is new and the pattern is still changing. Extract a module after you can identify repeated intent, stable inputs, and a useful contract. This keeps early Terraform easy to read while allowing reuse to emerge from evidence rather than prediction." },
  { id: "detail", text: "Look for two or three consumers with the same operational requirements, not merely similar resource types. Refactor the common behavior into a child module and leave meaningful differences as inputs. Document examples from actual callers so the module reflects how teams deploy it in practice." },
  { id: "pitfall", text: "Premature modules add variables, indirection, and release process before they solve a real duplication problem. The opposite extreme is endless copy-paste. Refactor when repeated code changes together or when a standard must be enforced consistently across consumers." },
  { id: "rule", text: "Extract modules from proven repeated patterns, not guesses." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
