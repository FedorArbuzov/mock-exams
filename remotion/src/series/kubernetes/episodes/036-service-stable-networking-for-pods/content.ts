import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Service";

export const AUDIO_SRC = "audio/kubernetes/036-service-stable-networking-for-pods.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.1;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Service",
  "ClusterIP",
  "Endpoints",
  "selector",
  "targetPort",
  "DNS",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Pods get new IPs - how do you give an app a stable address?",
  },
  {
    id: "define",
    text: "A Service. Pods are ephemeral; each restart gets a new IP. A Service gives you one stable virtual IP and a DNS name that never changes, then load-balances traffic to whichever Pods currently match its selector. Clients talk to the Service, not to individual Pods.",
  },
  {
    id: "failure",
    text: "The default type is ClusterIP - reachable only inside the cluster, perfect for service-to-service calls. NodePort and LoadBalancer expose it outside. Behind the scenes the Service keeps an Endpoints list of healthy Pod IPs, updated as Pods come and go.",
  },
  {
    id: "check",
    text: "What breaks: the selector matches no Pods, so Endpoints is empty and connections hang. Or targetPort does not match the container's real port, so traffic reaches the Service but dies at the Pod. Check kubectl get endpoints and kubectl get svc.",
  },
  {
    id: "rule",
    text: "Rule to remember: Pods are cattle with changing IPs - a Service is the stable front door.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
