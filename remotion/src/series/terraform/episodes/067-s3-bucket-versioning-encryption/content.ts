import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "S3 bucket";

export const AUDIO_SRC = "audio/terraform/067-s3-bucket-versioning-encryption.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.70;

export const HIGHLIGHT_WORDS = [
  "S3",
  "versioning",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "BUCKET",
  chips: [
    "versions",
    "encrypt",
    "lifecycle",
  ],
  lines: [
    "bucket -> versioning -> encryption",
  ],
  bad: "Easy destroy",
  good: "Recovery design",
  stamp: "DATA MATTERS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "An S3 bucket is simple until data recovery matters." },
  { id: "explain", text: "Terraform can create an S3 bucket and configure versioning and server-side encryption. Versioning keeps prior object versions for recovery from overwrite or deletion. Encryption protects stored data using provider-managed or customer-managed keys, depending on the chosen configuration." },
  { id: "detail", text: "Configure versioning intentionally, select an encryption approach that meets policy, and add lifecycle rules for old versions where cost matters. Name buckets carefully because names are globally constrained. Also define ownership, logging, tags, and access controls according to your organization standards." },
  { id: "pitfall", text: "Versioning does not prevent deletion; it preserves recoverable versions unless lifecycle rules remove them. Encryption alone does not grant or deny bucket access. Destroying a non-empty bucket may fail, or force-delete settings may remove valuable data unexpectedly." },
  { id: "rule", text: "Enable recovery and encryption, then design access and deletion deliberately." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
