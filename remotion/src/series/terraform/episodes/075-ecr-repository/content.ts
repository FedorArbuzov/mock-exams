import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "ECR";

export const AUDIO_SRC = "audio/terraform/075-ecr-repository.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.42;

export const HIGHLIGHT_WORDS = [
  "ECR",
  "containers",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "REGISTRY",
  chips: [
    "image",
    "digest",
    "scan",
  ],
  lines: [
    "CI -> ECR -> workload",
  ],
  bad: "latest only",
  good: "Pinned digest",
  stamp: "SHIP IMMUTABLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "ECR stores the container images your workload actually runs." },
  { id: "explain", text: "Amazon ECR is a private container image registry. Terraform can create repositories, configure image scanning, encryption, lifecycle policies, permissions, and tags. Applications then deploy images referenced by repository URL and immutable digest or controlled tag." },
  { id: "detail", text: "Create lifecycle rules to remove unneeded images while retaining releases needed for rollback. Enable scanning according to your security process and grant pull access only to the workload identities that need it. Have CI authenticate, build, scan, and push images separately from infrastructure apply." },
  { id: "pitfall", text: "Using only a mutable latest tag makes it hard to prove which code is running or roll back safely. Aggressive lifecycle policies can delete needed artifacts. Repository creation does not grant every runtime role permission to pull images." },
  { id: "rule", text: "Deploy immutable image references and retain enough artifacts for rollback." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
