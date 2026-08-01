import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "state surgery";

export const AUDIO_SRC = "audio/terraform/046-terraform-state-mv-rm-careful-surgery.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.69;

export const HIGHLIGHT_WORDS = [
  "state",
  "refactor",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "SURGERY",
  chips: [
    "backup",
    "mv",
    "plan",
  ],
  lines: [
    "$ terraform state mv old new",
  ],
  bad: "Bulk guess",
  good: "Exact move",
  stamp: "HANDLE CAREFULLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "State commands can repair ownership without touching the cloud." },
  { id: "explain", text: "terraform state mv changes a resource address in state, while terraform state rm removes Terraform's record of an object. Neither command directly modifies provider infrastructure. They are precise tools for refactors, imports, and emergency state repair." },
  { id: "detail", text: "Back up state through your backend process, run terraform state list, and use exact source and destination addresses. After every state operation, run terraform plan. A move preserves ownership under a new address; removal deliberately makes Terraform forget an object." },
  { id: "pitfall", text: "Removing a resource from state does not delete it. If matching configuration remains, a later plan may try to create a duplicate. A mistaken move can make Terraform believe a different resource owns saved attributes, creating destructive proposals." },
  { id: "rule", text: "Back up, operate once, and validate every state surgery with plan." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
