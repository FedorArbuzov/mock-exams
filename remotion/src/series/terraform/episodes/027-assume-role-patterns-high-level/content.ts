import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Assume Roles";

export const AUDIO_SRC = "audio/terraform/027-assume-role-patterns-high-level.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.33;

export const HIGHLIGHT_WORDS = [
  "assume_role",
  "temporary",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "temporary access",
  chips: [
    "identity",
    "role",
    "account",
  ],
  lines: [
    "source identity",
    "assume_role",
    "target account",
  ],
  bad: "permanent admin",
  good: "scoped role",
  stamp: "USE TEMPORARY ACCESS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "How can one identity access another AWS account?" },
  { id: "explain", text: "AWS role assumption lets a trusted identity receive temporary credentials for another role, often in another account. Terraform can use this pattern through the AWS provider. It supports centralized identity, separate development and production accounts, and smaller long-lived permission footprints." },
  { id: "detail", text: "A common pattern is to authenticate locally or in CI, then assume a deployment role with only the permissions needed for that environment. Configure trust policies on the target role and permissions on the source identity. Test with a least-privilege sandbox before production." },
  { id: "pitfall", text: "Assume role failures are usually authorization or trust-policy problems, not Terraform syntax problems. Avoid giving broad administrator access just to make an initial test pass; diagnose which principal and action were denied." },
  { id: "rule", text: "Authenticate once, then assume a narrowly scoped deployment role." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
