import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "S3 Backend";

export const AUDIO_SRC = "audio/terraform/039-remote-backend-s3.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.85;

export const HIGHLIGHT_WORDS = [
  "S3",
  "remote state",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "state in S3",
  chips: [
    "bucket",
    "versioning",
    "access",
  ],
  lines: [
    "backend \"s3\"",
    "bucket = \"tf-state\"",
    "key = \"prod/state\"",
  ],
  bad: "public bucket",
  good: "protected bucket",
  stamp: "S3 STORES TEAM STATE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "How can S3 hold Terraform state?" },
  { id: "explain", text: "The S3 backend stores Terraform state in an Amazon S3 object instead of a local file. This gives a team one shared state location and can use AWS controls such as encryption, bucket policies, versioning, and access logs. S3 stores the state; locking is a separate concern." },
  { id: "detail", text: "Configure a dedicated state bucket, a clear key path per environment, and the correct AWS region. Enable bucket versioning and encryption, then limit access to the deployment roles that need it. Run terraform init to initialize or migrate backend state, and verify the migration prompt carefully." },
  { id: "pitfall", text: "Do not use a public bucket or a broad shared bucket without strict policies. A backend configuration does not automatically make state secure; bucket permissions and encryption settings determine who can read it." },
  { id: "rule", text: "Store team state in a dedicated, versioned, access-controlled S3 bucket." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
