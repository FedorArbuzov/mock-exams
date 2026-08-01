import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "clean interface";

export const AUDIO_SRC = "audio/terraform/064-mini-checklist-clean-inputs-outputs.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.89;

export const HIGHLIGHT_WORDS = [
  "modules",
  "interface",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "CLEAN",
  chips: [
    "inputs",
    "locals",
    "outputs",
  ],
  lines: [
    "caller -> module -> outputs",
  ],
  bad: "Leaky internals",
  good: "Small contract",
  stamp: "INTERFACE CHECK",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A module is easiest to use when its interface is small." },
  { id: "explain", text: "Clean Terraform interfaces have typed, described inputs; safe defaults; focused validation; and small, meaningful outputs. Variables represent decisions callers should make. Locals represent internal derivations. Outputs represent stable results that people or other stacks actually need." },
  { id: "detail", text: "Review a module by asking whether every input changes a supported behavior and whether every output has a consumer. Validate environment-sensitive values, mark secrets sensitive, and provide examples. Test plans with representative input files, including invalid values that should fail early." },
  { id: "pitfall", text: "Exposing every underlying provider argument couples callers to internal implementation and makes upgrades painful. Outputting entire resources creates accidental dependencies. A sensitive label does not secure state, so interface design must be paired with backend access control." },
  { id: "rule", text: "Make module interfaces small, typed, documented, and intentionally stable." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
