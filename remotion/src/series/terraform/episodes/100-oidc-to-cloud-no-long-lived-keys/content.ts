import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "OIDC";

export const AUDIO_SRC = "audio/terraform/100-oidc-to-cloud-no-long-lived-keys.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.67;

export const HIGHLIGHT_WORDS = [
  "OIDC",
  "temporary credentials",
  "IAM",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "OIDC",
  chips: [
    "CI token",
    "role",
    "AWS",
  ],
  lines: [
    "CI token -> AssumeRole",
    "No stored access key",
  ],
  bad: "Permanent CI key",
  good: "Short-lived role session",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Your CI job should borrow cloud access, not store it forever." },
  { id: "explain", text: "OpenID Connect lets a CI workload exchange a short-lived identity token for temporary cloud credentials. Instead of storing an AWS access key in CI secrets, AWS verifies claims from the trusted identity provider and grants a narrowly scoped role. This reduces secret rotation and long-lived credential exposure." },
  { id: "detail", text: "Configure a trust policy that checks issuer, audience, repository, branch, and environment claims as supported by the CI provider. Grant the assumed role only the permissions needed for planning or applying. Log role sessions and review them like other privileged access. Separate roles by environment." },
  { id: "pitfall", text: "OIDC is not automatically safe if the trust policy accepts tokens from any repository, branch, or audience. A broad role can still cause major damage. Restrict who may assume the role, protect deployment branches, and test denial paths as well as success." },
  { id: "rule", text: "Use short-lived OIDC roles with tightly scoped trust claims." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
