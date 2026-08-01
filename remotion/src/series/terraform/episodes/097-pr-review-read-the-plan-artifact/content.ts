import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Plan review";

export const AUDIO_SRC = "audio/terraform/097-pr-review-read-the-plan-artifact.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.82;

export const HIGHLIGHT_WORDS = [
  "PR",
  "artifact",
  "review",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "PLAN",
  chips: [
    "create",
    "change",
    "destroy",
  ],
  lines: [
    "+ create",
    "-/+ replace",
  ],
  bad: "Approve code only",
  good: "Approve code and plan",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "The plan is the change request translated into infrastructure actions." },
  { id: "explain", text: "A Terraform plan artifact shows what Terraform intends to create, change, replace, and destroy for a specific configuration and state. Review it in the pull request alongside the code. It often reveals impact that code structure alone hides, especially replacement and deletion caused by immutable fields." },
  { id: "detail", text: "Verify the plan was generated with the expected workspace, variables, provider versions, and commit. Look closely at destructive actions, security-sensitive fields, IAM policy changes, public exposure, and cost-affecting resources. Keep the artifact accessible long enough for reviewers and approvers to audit the proposed change." },
  { id: "pitfall", text: "Treating a green CI job as approval ignores the most valuable output it produced. Plans can become stale if configuration or state changes afterward. Ensure the apply uses the reviewed plan artifact or regenerates under controlled approval rules." },
  { id: "rule", text: "Review planned actions, especially destroys, replacements, access, and cost." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
