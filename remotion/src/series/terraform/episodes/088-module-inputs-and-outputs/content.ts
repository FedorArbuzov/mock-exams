import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module interface";

export const AUDIO_SRC = "audio/terraform/088-module-inputs-and-outputs.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 32.64;

export const HIGHLIGHT_WORDS = [
  "variables",
  "outputs",
  "contract",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "API",
  chips: [
    "input",
    "module",
    "output",
  ],
  lines: [
    "variable \"name\" {}",
    "output \"bucket_arn\" {}",
  ],
  bad: "Leak every attribute",
  good: "Small clear contract",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A module interface is a promise to every caller." },
  { id: "explain", text: "Input variables let callers configure a child module, while outputs return values callers need, such as IDs, ARNs, or endpoints. Together they form the module contract. Design that contract around business intent instead of leaking every internal provider attribute to the root module." },
  { id: "detail", text: "Give inputs types, descriptions, validations, and sensible defaults where appropriate. Mark sensitive values so Terraform redacts them in normal output. Export only outputs that callers genuinely need; each output becomes a compatibility commitment. Use explicit names that explain what the value represents and when it exists." },
  { id: "pitfall", text: "A module with dozens of pass-through variables is usually a copied resource schema, not a useful abstraction. It burdens callers and makes upgrades difficult. Likewise, exposing every internal ID couples consumers to implementation choices that should remain private." },
  { id: "rule", text: "Expose intentional inputs and only necessary outputs." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
