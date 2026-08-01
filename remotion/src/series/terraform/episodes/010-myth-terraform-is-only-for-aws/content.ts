import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Beyond AWS";

export const AUDIO_SRC = "audio/terraform/010-myth-terraform-is-only-for-aws.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.38;

export const HIGHLIGHT_WORDS = [
  "providers",
  "multi-cloud",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "AWS only?",
  chips: [
    "AWS",
    "Azure",
    "GitHub",
  ],
  lines: [
    "provider \"aws\"",
    "provider \"github\"",
  ],
  bad: "AWS-only myth",
  good: "many APIs",
  stamp: "PROVIDERS EXPAND REACH",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Does Terraform only speak AWS?" },
  { id: "explain", text: "Terraform is not an AWS-only tool. Providers let it manage Azure, Google Cloud, Kubernetes, GitHub, Cloudflare, Datadog, and many other APIs. The Terraform workflow stays familiar while each provider translates resources into calls for its own platform." },
  { id: "detail", text: "Browse the Terraform Registry to check whether a provider and resource exist before designing an automation. Pin trusted provider versions and read the provider documentation for authentication and behavior. You can combine providers in one configuration when the resources need coordinated dependencies." },
  { id: "pitfall", text: "A provider is not an official guarantee just because it appears in the registry. Check its publisher, maintenance activity, documentation quality, and whether it supports the exact API features your team needs." },
  { id: "rule", text: "Terraform is a workflow engine; providers decide which platforms it controls." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
