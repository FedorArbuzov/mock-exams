import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Lambda packaging";

export const AUDIO_SRC = "audio/terraform/070-lambda-function-packaging-high-level.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.84;

export const HIGHLIGHT_WORDS = [
  "Lambda",
  "artifacts",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "LAMBDA",
  chips: [
    "build",
    "artifact",
    "deploy",
  ],
  lines: [
    "CI build -> digest -> Terraform",
  ],
  bad: "Build in apply",
  good: "Immutable artifact",
  stamp: "SEPARATE BUILD",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Terraform deploys an artifact. It should not become your build system." },
  { id: "explain", text: "A Lambda function needs code packaged as a ZIP file or container image, plus runtime settings, execution role, handler, memory, timeout, and environment configuration. Terraform can reference a built artifact and deploy its versioned change to AWS." },
  { id: "detail", text: "Build and test artifacts in a dedicated CI step, publish them to controlled storage or a registry, and pass an immutable reference to Terraform. Use source hashes or image digests so Terraform detects intended code changes. Keep deployment identity and execution identity separate." },
  { id: "pitfall", text: "Building application code during Terraform apply makes plans less reproducible and mixes build failures with infrastructure changes. Do not store secrets in Lambda environment variables without appropriate encryption and access design. A successful upload does not prove runtime permissions work." },
  { id: "rule", text: "Build immutable artifacts first; let Terraform deploy their references." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
