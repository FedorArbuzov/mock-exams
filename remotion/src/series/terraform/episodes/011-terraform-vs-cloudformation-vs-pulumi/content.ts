import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "IaC Choices";

export const AUDIO_SRC = "audio/terraform/011-terraform-vs-cloudformation-vs-pulumi.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.80;

export const HIGHLIGHT_WORDS = [
  "Terraform",
  "CloudFormation",
  "Pulumi",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "which IaC tool?",
  chips: [
    "Terraform",
    "CFN",
    "Pulumi",
  ],
  lines: [
    "multi-platform?",
    "AWS native?",
  ],
  bad: "trend choice",
  good: "team fit",
  stamp: "FIT BEATS HYPE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Which infrastructure tool should you pick?" },
  { id: "explain", text: "Terraform uses a declarative language and supports many providers through a consistent workflow. CloudFormation is deeply integrated with AWS and its native services. Pulumi lets teams use general-purpose languages, which can be attractive when infrastructure needs rich programming abstractions." },
  { id: "detail", text: "Choose based on your cloud scope, team skills, existing modules, governance needs, and operational support. A single-cloud AWS team may value CloudFormation integration, while a multi-platform team may prefer Terraform's ecosystem. Test small real workflows before standardizing across the organization." },
  { id: "pitfall", text: "Do not choose solely because a tool is fashionable or its syntax looks familiar. Migration cost, state management, provider maturity, and team troubleshooting experience matter long after the first demo." },
  { id: "rule", text: "Choose the tool your team can safely operate repeatedly." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
