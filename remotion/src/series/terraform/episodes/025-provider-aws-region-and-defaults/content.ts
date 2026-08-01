import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "AWS Provider";

export const AUDIO_SRC = "audio/terraform/025-provider-aws-region-and-defaults.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.62;

export const HIGHLIGHT_WORDS = [
  "AWS",
  "region",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "which region?",
  chips: [
    "provider",
    "variable",
    "profile",
  ],
  lines: [
    "region = \"us-east-1\"",
    "AWS_REGION=...",
  ],
  bad: "hidden default",
  good: "explicit region",
  stamp: "REGION IS A DECISION",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Where does Terraform create AWS resources?" },
  { id: "explain", text: "The AWS provider needs a region for regional resources such as VPCs and EC2 instances. You can set it directly, pass it through a variable, or use supported AWS environment and shared configuration defaults. Some AWS resources are global, but provider region still influences many operations." },
  { id: "detail", text: "Make the region visible in your configuration or environment documentation, especially for teams and CI. Use a variable with a sensible validation rule when projects need multiple regions. Run plan and inspect region-sensitive resource addresses before apply, because the wrong region creates an isolated environment." },
  { id: "pitfall", text: "Relying silently on a developer's default AWS profile can put resources in different regions across machines. Do not assume an existing resource will be found when your provider points at another region." },
  { id: "rule", text: "Make the target AWS region explicit and review it in every plan." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
