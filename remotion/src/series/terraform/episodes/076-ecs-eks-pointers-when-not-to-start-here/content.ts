import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "ECS EKS pointers";

export const AUDIO_SRC = "audio/terraform/076-ecs-eks-pointers-when-not-to-start-here.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.40;

export const HIGHLIGHT_WORDS = [
  "ECS",
  "EKS",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "ORCHESTRATE",
  chips: [
    "network",
    "identity",
    "ops",
  ],
  lines: [
    "image -> ECS or EKS -> service",
  ],
  bad: "Cluster first",
  good: "Need-driven choice",
  stamp: "EARN COMPLEXITY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Containers solve packaging, but orchestration adds real complexity." },
  { id: "explain", text: "ECS and EKS run containerized workloads on AWS. ECS is tightly integrated with AWS primitives, while EKS manages Kubernetes control-plane and cluster concerns. Terraform can provision surrounding infrastructure, but application delivery, observability, security, and operations remain substantial work." },
  { id: "detail", text: "Start with a simpler managed service when a single web service or scheduled job does not need orchestration features. If choosing ECS or EKS, define networking, identity, image supply, logs, metrics, scaling, deployment strategy, and team operating ownership before production." },
  { id: "pitfall", text: "A cluster is not an application platform by itself. EKS especially adds Kubernetes upgrades, add-ons, networking, policy, and workload operations. Copying a full cluster template before these decisions creates expensive, hard-to-debug infrastructure and unclear responsibility." },
  { id: "rule", text: "Choose ECS or EKS only when their operational complexity earns its value." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
