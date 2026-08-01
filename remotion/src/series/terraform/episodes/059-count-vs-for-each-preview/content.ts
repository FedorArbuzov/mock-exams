import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "count for_each";

export const AUDIO_SRC = "audio/terraform/059-count-vs-for-each-preview.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.22;

export const HIGHLIGHT_WORDS = [
  "count",
  "for_each",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "IDENTITY",
  chips: [
    "index",
    "key",
    "stable",
  ],
  lines: [
    "for_each = var.subnets",
  ],
  bad: "Shifting index",
  good: "Stable key",
  stamp: "MODEL IDENTITY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Repeated resources need stable identities, not just positions." },
  { id: "explain", text: "count creates instances addressed by numeric indexes, while for_each creates instances addressed by stable map keys or set values. Both repeat resources, but their state identity differs. Choosing the right one prevents unnecessary replacement when a collection changes." },
  { id: "detail", text: "Use count for truly identical instances selected by a number or simple conditional. Use for_each when each object has a meaningful name, configuration, or lifecycle. Prefer maps with explicit keys, because a set's values become identity and must remain stable." },
  { id: "pitfall", text: "Removing the first item from a count-based list shifts later indexes, causing Terraform to replace or rename the wrong instances. Changing a for_each key also changes identity. Neither approach fixes a poorly modeled relationship or unstable input data." },
  { id: "rule", text: "Use for_each for named objects; use count for simple identical instances." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
