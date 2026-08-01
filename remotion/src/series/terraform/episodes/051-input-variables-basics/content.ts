import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "variables";

export const AUDIO_SRC = "audio/terraform/051-input-variables-basics.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.02;

export const HIGHLIGHT_WORDS = [
  "variables",
  "modules",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "INPUT",
  chips: [
    "type",
    "default",
    "var",
  ],
  lines: [
    "name = var.environment",
  ],
  bad: "Every setting",
  good: "Clear interface",
  stamp: "EXPLICIT INPUTS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Variables make reusable configuration explicit." },
  { id: "explain", text: "Input variables parameterize a Terraform module or root configuration. A variable block can declare a description, type, default, validation, and sensitive flag. Callers provide values, allowing the same code to create environment-specific resources without editing internal expressions." },
  { id: "detail", text: "Reference values with var.name and give variables meaningful names that describe intent, not implementation accidents. Require values that must be consciously chosen, such as environment or CIDR. Use defaults only where a safe, broadly useful value actually exists." },
  { id: "pitfall", text: "Too many variables make a module hard to understand and test. Do not expose every resource argument automatically. A good module presents a small interface that reflects supported decisions, while keeping internal naming and implementation details private." },
  { id: "rule", text: "Expose intentional inputs, type them clearly, and document their purpose." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
