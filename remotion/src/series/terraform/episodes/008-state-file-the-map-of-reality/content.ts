import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Terraform State";

export const AUDIO_SRC = "audio/terraform/008-state-file-the-map-of-reality.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.73;

export const HIGHLIGHT_WORDS = [
  "state",
  "mapping",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "the reality map",
  chips: [
    "code",
    "state",
    "cloud",
  ],
  lines: [
    "$ terraform state list",
    "$ terraform show",
  ],
  bad: "lost state",
  good: "protected state",
  stamp: "STATE = MEMORY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "How does Terraform know what it built?" },
  { id: "explain", text: "Terraform state is its map between resource addresses in your code and real cloud objects. It records identifiers, attributes, dependencies, and provider data needed to calculate future changes. Without state, Terraform cannot reliably tell whether an object already exists or needs updating." },
  { id: "detail", text: "After apply, inspect state with terraform state list or terraform show. Treat terraform.tfstate as sensitive operational data because it can contain resource values and sometimes secret values. For shared work, store state remotely with access control, backups, versioning, and locking." },
  { id: "pitfall", text: "Do not hand-edit state to fix ordinary configuration mistakes. Manual edits can break Terraform's mapping; prefer configuration changes, import, state move, or state remove only when you understand the consequence." },
  { id: "rule", text: "State is Terraform's memory, so protect it like production data." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
