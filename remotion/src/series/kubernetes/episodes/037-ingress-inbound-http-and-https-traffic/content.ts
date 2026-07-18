import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Ingress";

export const AUDIO_SRC = "audio/kubernetes/037-ingress-inbound-http-and-https-traffic.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 78.7;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Ingress",
  "Ingress Controller",
  "TLS",
  "host",
  "path",
  "NGINX",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you route external traffic by domain and path?",
  },
  {
    id: "define",
    text: "Ingress. A Service can expose one app, but you do not want a LoadBalancer per app. Ingress is a single HTTP and HTTPS entry point with rules: host api dot example dot com goes to the api Service, path slash app goes to the frontend Service. It also terminates TLS in one place.",
  },
  {
    id: "failure",
    text: "But Ingress is only rules. Nothing happens without an Ingress Controller - like NGINX, Traefik, or a cloud one - actually running in the cluster to read those rules and route traffic. The Ingress object is the config; the controller is the engine.",
  },
  {
    id: "check",
    text: "What beginners get wrong: creating an Ingress with no controller installed, then wondering why the address stays empty. Or forgetting the TLS Secret, so HTTPS fails. Path types trip people - Prefix versus Exact. Check kubectl get ingress for ADDRESS; confirm controller Pods run first.",
  },
  {
    id: "rule",
    text: "Rule to remember: Ingress is rules - it needs a controller to do anything.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
