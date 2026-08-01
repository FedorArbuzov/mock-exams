import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "First Resource";

export const AUDIO_SRC = "audio/terraform/019-first-resource-aws-s3-bucket-or-local-mock.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 62.95;

export const HIGHLIGHT_WORDS = [
  "resource",
  "S3",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "first resource",
  chips: [
    "sandbox",
    "plan",
    "apply",
  ],
  lines: [
    "resource \"aws_s3_bucket\"",
    "$ terraform plan",
  ],
  bad: "prod practice",
  good: "safe sandbox",
  stamp: "LEARN SAFELY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "What is the safest first thing to create?" },
  { id: "explain", text: "A resource block declares one managed object, such as an AWS S3 bucket. It has a type, a local name, and provider-specific arguments. If you do not have a safe AWS sandbox, use a local mock provider or a simple local resource to learn the workflow first." },
  { id: "detail", text: "Give cloud resources unique names and use a sandbox account with spending alerts. Run init, validate, and plan before apply, then inspect the result. For an S3 exercise, remember that bucket names are globally unique and AWS settings may vary by region." },
  { id: "pitfall", text: "Copying an old S3 example can fail because provider schemas and AWS defaults evolve. Never practice in a production account just because a resource sounds harmless; ownership policies and naming collisions still matter." },
  { id: "rule", text: "Your first resource should teach the workflow without risking production." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
