import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl port-forward";

export const AUDIO_SRC = "audio/kubernetes/045-kubectl-port-forward-local-access-to-a-service.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.36;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "port-forward",
  "tunnel",
  "Service",
  "Ingress",
  "debugging",
  "local",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you test a service without an Ingress?",
  },
  {
    id: "define",
    text: "kubectl port-forward. It tunnels a port from your laptop straight to a Pod or Service inside the cluster, over the Kubernetes API - no LoadBalancer, no Ingress, no public exposure. kubectl port-forward service slash my-api 8080 colon 80 maps local 8080 to the Service port 80.",
  },
  {
    id: "pitfall",
    text: "It is perfect for private debugging. Hit a database admin UI, curl an internal API, or open a dashboard that should never be public. Traffic stays on your machine and dies when you stop the command.",
  },
  {
    id: "check",
    text: "What beginners get wrong: expecting port-forward to be production access - it is a single-user tunnel tied to your terminal, not load-balanced. Or forwarding to a Pod that reschedules, breaking the tunnel; forwarding to a Service is more stable. Watch for a local port already in use.",
  },
  {
    id: "rule",
    text: "Rule to remember: port-forward is a private tunnel for debugging, not a front door.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
