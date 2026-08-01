import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "CI deployment";

export const AUDIO_SRC = "audio/terraform/099-terraform-apply-from-ci-with-guards.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.37;

export const HIGHLIGHT_WORDS = [
  "apply",
  "approval",
  "guardrails",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "GO",
  chips: [
    "plan",
    "approve",
    "apply",
  ],
  lines: [
    "saved plan -> approval",
    "approval -> apply",
  ],
  bad: "Any branch applies",
  good: "Protected approved apply",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Automation can apply safely only when the approval path is explicit." },
  { id: "explain", text: "CI can run terraform apply after review, but it needs guardrails: protected branches, environment approvals, scoped cloud identity, serialized runs, and an auditable trigger. The safest flow applies the exact saved plan that reviewers approved, rather than recalculating a potentially different plan at execution time." },
  { id: "detail", text: "Limit production apply jobs to trusted repositories and protected deployment environments. Require human approval where policy requires it, prevent concurrent applies to the same state, and retain logs. Confirm the job uses the intended backend, workspace, and plan file. Add rollback or incident handoff guidance for failures." },
  { id: "pitfall", text: "An automatic apply on every branch or a job with broad permanent credentials turns a code mistake into an immediate cloud incident. Replanning after approval also creates a time-of-check gap. Bind authorization, plan, and apply to one controlled workflow." },
  { id: "rule", text: "Apply approved saved plans from protected, serialized CI workflows." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
