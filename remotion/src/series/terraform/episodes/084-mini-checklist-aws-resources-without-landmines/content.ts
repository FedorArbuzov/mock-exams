import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "AWS resource safety";

export const AUDIO_SRC = "audio/terraform/084-mini-checklist-aws-resources-without-landmines.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.86;

export const HIGHLIGHT_WORDS = [
  "review",
  "security",
  "lifecycle",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "CHECK",
  chips: [
    "tags",
    "access",
    "cost",
  ],
  lines: [
    "Name",
    "Owner",
    "Replacement impact",
  ],
  bad: "Schema-only review",
  good: "Operational review",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Before apply, ask what happens when this resource changes or disappears." },
  { id: "explain", text: "Safe AWS resources have clear names, required tags, least-privilege access, and an intentional lifecycle. They record logs where needed and keep cost controls such as retention or sizing visible. Terraform configuration should explain operational choices, not merely satisfy the provider schema." },
  { id: "detail", text: "Review immutable fields, replacement behavior, deletion impact, encryption, backup needs, network exposure, and service quotas. Ensure every production resource has an owner and an environment label. Then read the plan for unexpected creates, destroys, and replacements before approving any change." },
  { id: "pitfall", text: "A resource can be syntactically valid yet operationally dangerous. Default retention, public network paths, missing tags, or an unprotected database often pass terraform validate. Safety comes from reviewing intent and effects, not from a successful syntax check." },
  { id: "rule", text: "Review ownership, lifecycle, security, cost, and replacement impact." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
