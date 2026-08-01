import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "S3 public access";

export const AUDIO_SRC = "audio/terraform/068-bucket-public-access-blocks.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.12;

export const HIGHLIGHT_WORDS = [
  "S3",
  "security",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "BLOCK",
  chips: [
    "private",
    "policy",
    "guardrail",
  ],
  lines: [
    "block_public_acls = true",
  ],
  bad: "Open bucket",
  good: "Private default",
  stamp: "DENY ACCIDENTS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Public access should be a conscious exception, never a default." },
  { id: "explain", text: "S3 public access block settings help prevent buckets and objects from becoming publicly accessible through ACLs or policies. Terraform can manage these settings alongside the bucket. They provide a guardrail against common accidental exposure paths, especially for data buckets." },
  { id: "detail", text: "Enable all four block settings unless a documented design requires otherwise. Use bucket policies and IAM for controlled private access, then test with the intended principals. Organization-level controls can add another layer, but application teams should still declare bucket protections." },
  { id: "pitfall", text: "A public access block may conflict with legacy static-site patterns or existing public policies. Disabling it broadly to solve one access problem exposes more than intended. Do not confuse public access settings with encryption, authentication, or network-level controls." },
  { id: "rule", text: "Block public S3 access by default and document every exception." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
