import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "AWS Credentials";

export const AUDIO_SRC = "audio/terraform/026-credentials-env-vars-vs-shared-config.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.67;

export const HIGHLIGHT_WORDS = [
  "credentials",
  "profiles",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "where keys live",
  chips: [
    "env",
    "profile",
    "role",
  ],
  lines: [
    "AWS_PROFILE=dev",
    "AWS_ACCESS_KEY_ID",
    "shared config",
  ],
  bad: "keys in .tf",
  good: "credential chain",
  stamp: "KEEP KEYS OUT OF CODE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Where should AWS credentials live?" },
  { id: "explain", text: "Terraform can obtain AWS credentials from environment variables, shared AWS configuration files, profiles, and identity roles. Environment variables are convenient for CI and temporary sessions. Shared configuration is convenient for local development because named profiles keep multiple accounts and roles organized outside the codebase." },
  { id: "detail", text: "For local work, authenticate with AWS's supported tooling and select a named profile where appropriate. For CI, prefer short-lived credentials issued through workload identity or role assumption. Let the AWS provider use its standard credential chain instead of placing access keys inside Terraform files." },
  { id: "pitfall", text: "Environment variables can leak through logs, shell history, process listings, or accidentally exported build output. Shared config files are also sensitive and should stay outside Git, with correct file permissions." },
  { id: "rule", text: "Keep credentials outside Terraform code and prefer short-lived identity." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
