import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "CI planning";

export const AUDIO_SRC = "audio/terraform/098-terraform-plan-in-ci.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.99;

export const HIGHLIGHT_WORDS = [
  "CI",
  "plan",
  "credentials",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "CI",
  chips: [
    "PR",
    "plan",
    "review",
  ],
  lines: [
    "push -> terraform plan",
    "artifact -> reviewer",
  ],
  bad: "Apply discovers changes",
  good: "PR previews changes",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "CI should show infrastructure consequences before merge, not after incident." },
  { id: "explain", text: "Running terraform plan in CI gives pull request reviewers a consistent preview of infrastructure changes. The job initializes the configured backend, validates the configuration, and generates a plan using controlled variables and credentials. Publish the readable plan output as a protected review artifact or PR comment." },
  { id: "detail", text: "Use a read-only cloud identity where possible and isolate credentials per environment. Pin Terraform and provider versions so CI behaves consistently with developer machines. Do not expose secret values in logs. Fail the job on validation errors, policy violations, or unexpected plan generation failures." },
  { id: "pitfall", text: "A CI plan that runs against the wrong workspace or uses default variables gives false confidence. Plans also may read sensitive values or reveal resource details. Make environment selection explicit, protect logs and artifacts, and record exactly which commit generated the plan." },
  { id: "rule", text: "Generate protected, environment-specific plans for every infrastructure change." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
