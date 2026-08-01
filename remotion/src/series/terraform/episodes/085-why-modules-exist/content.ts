import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Terraform modules";

export const AUDIO_SRC = "audio/terraform/085-why-modules-exist.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.41;

export const HIGHLIGHT_WORDS = [
  "reuse",
  "inputs",
  "outputs",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "BOX",
  chips: [
    "inputs",
    "resources",
    "outputs",
  ],
  lines: [
    "module \"network\" {",
    "source = \"./modules/network\"",
  ],
  bad: "Copy-paste stacks",
  good: "Shared stable pattern",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Copy-paste is a module you forgot to name and test." },
  { id: "explain", text: "A Terraform module groups related resources behind inputs and outputs. Modules reduce repeated patterns, give teams a shared interface, and let maintainers improve a standard implementation once. The root configuration calls modules for a specific environment or workload, while child modules implement reusable building blocks." },
  { id: "detail", text: "A useful module captures a pattern that repeats with stable intent, such as a service bucket or network segment. Its variables expose real choices, and its outputs expose useful references. Keep the interface small enough that callers understand it without reading every resource inside." },
  { id: "pitfall", text: "Modules do not automatically simplify a design. A thin wrapper around one changing resource can hide important behavior and slow debugging. Start with direct resources until a pattern repeats, then extract the stable parts with tests and documentation." },
  { id: "rule", text: "Module repeated intent, not every individual resource." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
