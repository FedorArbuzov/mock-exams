import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "CloudWatch Logs";

export const AUDIO_SRC = "audio/terraform/077-cloudwatch-log-groups.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.77;

export const HIGHLIGHT_WORDS = [
  "CloudWatch",
  "retention",
  "KMS",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "LOG",
  chips: [
    "app logs",
    "30 days",
    "KMS",
  ],
  lines: [
    "aws_cloudwatch_log_group",
    "retention_in_days = 30",
  ],
  bad: "Default retention forever",
  good: "Declared log lifecycle",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Logs are useless if every service hides them somewhere different." },
  { id: "explain", text: "A CloudWatch log group is a named container for related log streams, such as one application, Lambda function, or ECS service. Terraform can create it with predictable naming, retention, encryption, and tags. Treat the log group as infrastructure, not an accidental side effect created by the workload." },
  { id: "detail", text: "Set retention deliberately so useful evidence survives without storing data forever. Use KMS encryption where requirements call for it, and grant writers only the permissions they need. A stable group name also makes dashboards, subscriptions, metric filters, and incident runbooks easier to automate across environments." },
  { id: "pitfall", text: "Relying on AWS defaults often creates log groups with unlimited retention after a service first writes. That quietly increases cost and makes cleanup inconsistent. Creating the group first in Terraform lets you choose lifecycle settings before application traffic arrives." },
  { id: "rule", text: "Create log groups explicitly with retention, encryption, and ownership tags." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
