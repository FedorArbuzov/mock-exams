import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Not Docker on steroids";

export const AUDIO_SRC = "audio/kubernetes/012-myth-kubernetes-equals-docker-on-steroids.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 67.51;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Docker",
  "Kubernetes",
  "orchestrates",
  "Pending",
  "ImagePullBackOff",
  "controllers",
  "cluster",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "It's just Docker on steroids, right?",
  },
  {
    id: "define",
    text: "No. Docker runs a container on one machine. Kubernetes orchestrates many machines: desired state, scheduling, networking, health checks, rolling updates, and access policy. Containers are the unit. The cluster is the product.",
  },
  {
    id: "myth",
    text: "What breaks when you believe the myth: you think kubectl apply is docker run with YAML. Then a Pod is Pending, Endpoints are empty, or ImagePullBackOff appears, and Docker knowledge alone cannot explain it. You need nodes, kubelet, Services, and controllers.",
  },
  {
    id: "check",
    text: "Practical check: compare mental models. Docker Compose says start these containers together. Kubernetes says keep this Deployment at three healthy replicas forever, even if a node dies. That loop is not a bigger Docker daemon.",
  },
  {
    id: "rule",
    text: "Rule to remember: Docker runs containers. Kubernetes runs the cluster contract around them.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
