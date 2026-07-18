import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Compose to Kubernetes";

export const AUDIO_SRC = "audio/kubernetes/022-docker-compose-to-kubernetes-mental-mapping.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.26;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Deployment",
  "Service",
  "PersistentVolumeClaim",
  "ConfigMap",
  "Secret",
  "readiness",
  "namespace",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "You have a docker-compose file - how do you think in Kubernetes?",
  },
  {
    id: "define",
    text: "Map the concepts, do not translate line by line. A Compose service becomes a Deployment that runs your Pods, plus a Service that gives them a stable network name. Container ports map to a Service port. depends_on has no direct twin - Kubernetes relies on readiness probes and retries instead.",
  },
  {
    id: "pitfall",
    text: "Keep going: named volumes become PersistentVolumeClaims. The environment block splits into a ConfigMap for plain settings and a Secret for sensitive values. A shared Compose network is roughly the flat Pod network inside one namespace, where Pods reach each other by Service name.",
  },
  {
    id: "check",
    text: "What breaks: people expect docker compose up ordering and one host. Kubernetes spreads Pods across nodes, restarts them, and gives no guaranteed start order. Design for that: health checks, not sleep.",
  },
  {
    id: "rule",
    text: "Rule to remember: service is Deployment plus Service, volumes are PVCs, env is ConfigMap and Secret.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
