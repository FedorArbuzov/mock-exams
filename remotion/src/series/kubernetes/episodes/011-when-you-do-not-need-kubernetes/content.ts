import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "When NOT Kubernetes";

export const AUDIO_SRC = "audio/kubernetes/011-when-you-do-not-need-kubernetes.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.58;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Kubernetes",
  "VM",
  "PaaS",
  "Compose",
  "complexity",
  "ops tax",
  "sandbox",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Everyone runs Kubernetes - does that mean you should too?",
  },
  {
    id: "define",
    text: "Not always. Kubernetes shines when you have many services, rolling deploys, autoscaling, and a team that can operate the platform. For one small app and two people, a single VM, a PaaS, or Compose can ship faster with less ops tax.",
  },
  {
    id: "filter",
    text: "What beginners get wrong: they adopt Kubernetes because LinkedIn said so, then spend weeks fighting Ingress, storage, and RBAC before the product exists. Complexity is a cost you pay every day, not a badge.",
  },
  {
    id: "check",
    text: "Practical filter: if you cannot name three problems Kubernetes solves for you this quarter - scheduling across nodes, self-healing replicas, standard deploy workflow - wait. Learn the concepts, run a local sandbox, but do not put production on a cluster you cannot debug at two a.m. Also ask: will someone on-call understand Nodes, Services, and Ingress when traffic dies? If the answer is no, stay on a simpler hosting model until the team is ready.",
  },
  {
    id: "rule",
    text: "Rule to remember: pick Kubernetes for scale and team velocity, not for resume points.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
