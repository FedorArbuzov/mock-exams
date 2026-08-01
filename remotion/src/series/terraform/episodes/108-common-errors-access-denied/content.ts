import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Troubleshooting";

export const AUDIO_SRC = "audio/terraform/108-common-errors-access-denied.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.91;

export const HIGHLIGHT_WORDS = [
  "IAM",
  "least privilege",
  "role",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "DENY",
  chips: [
    "identity",
    "action",
    "policy",
  ],
  lines: [
    "Who called?",
    "Which action denied?",
  ],
  bad: "Grant admin access",
  good: "Add narrow permission",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Access denied is a precise signal: identity, action, resource, or condition mismatched." },
  { id: "explain", text: "An access denied error means the cloud identity used by Terraform lacks permission under the effective authorization rules. The cause may be an IAM policy, resource policy, permission boundary, service control policy, session policy, or an unmet condition. Capture the denied action, resource, and assumed role first." },
  { id: "detail", text: "Check the exact CI or local identity, then inspect relevant policies and conditions such as region, tags, source VPC, or OIDC claims. Grant the smallest missing permission to the correct role. Use cloud audit logs or policy simulation where available to validate the diagnosis before rerunning." },
  { id: "pitfall", text: "Adding AdministratorAccess to unblock a deployment hides the real policy gap and creates lasting risk. Testing with a personal administrator identity also proves little about CI. Debug using the actual role and narrow the permission change to the necessary action." },
  { id: "rule", text: "Diagnose the exact denied action, then grant least privilege." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
