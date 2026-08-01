import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Read the Plan";

export const AUDIO_SRC = "audio/terraform/020-terraform-plan-reading-the-diff.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 60.72;

export const HIGHLIGHT_WORDS = [
  "diff",
  "replacement",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "read the diff",
  chips: [
    "add",
    "change",
    "destroy",
  ],
  lines: [
    "+ create",
    "~ update",
    "- destroy",
  ],
  bad: "count only",
  good: "inspect changes",
  stamp: "PLAN IS THE DIFF",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "What do those plan symbols really mean?" },
  { id: "explain", text: "Terraform plan shows the proposed difference between configuration, state, and provider-read reality. A plus means create, a minus means destroy, and a tilde means update in place. Some changes force replacement, shown as destroy and create, which deserves extra attention." },
  { id: "detail", text: "Read the summary first, then inspect each resource address and changed attribute. Look for unexpected destroys, replacements, wrong regions, wrong counts, and values that came from variables. Use terraform plan -out with care in automation when a reviewed, exact plan must be applied." },
  { id: "pitfall", text: "Do not approve a plan based only on its final count. One replacement can mean downtime, data loss, or a new identifier even when the summary says only one add and one destroy." },
  { id: "rule", text: "Read every destroy and replacement as if it affects production." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
