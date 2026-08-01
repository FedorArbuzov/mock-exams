import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "dynamic blocks";

export const AUDIO_SRC = "audio/terraform/063-dynamic-blocks-when-yaml-would-explode.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 67.92;

export const HIGHLIGHT_WORDS = [
  "dynamic",
  "blocks",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "REPEAT",
  chips: [
    "nested",
    "data",
    "typed",
  ],
  lines: [
    "dynamic \"ingress\" {",
  ],
  bad: "Template maze",
  good: "Data-driven block",
  stamp: "USE SPARINGLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Dynamic blocks generate nested configuration, not unlimited magic." },
  { id: "explain", text: "A dynamic block generates repeated nested blocks from a collection, such as security group rules or load balancer listeners. It helps when a provider schema requires blocks rather than an assignable list. The result remains normal Terraform configuration after evaluation." },
  { id: "detail", text: "Use dynamic blocks when repeated nested structure is genuinely data-driven. Give iterator names meaningful labels, keep input objects strongly typed, and use locals to normalize data first. If a provider accepts a direct argument collection, prefer that simpler form." },
  { id: "pitfall", text: "Dynamic blocks can turn configuration into unreadable templating when used for every optional field. They cannot generate meta-arguments like lifecycle or provider. Complex nested dynamic logic is often a signal to split a module or simplify the input model." },
  { id: "rule", text: "Generate only data-driven nested blocks and keep their input shape clear." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
