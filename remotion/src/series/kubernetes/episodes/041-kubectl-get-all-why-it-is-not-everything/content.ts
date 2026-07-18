import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl get all";

export const AUDIO_SRC = "audio/kubernetes/041-kubectl-get-all-why-it-is-not-everything.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.15;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "get all",
  "ConfigMap",
  "Secret",
  "Ingress",
  "api-resources",
  "namespace-scoped",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why does kubectl get all not show everything?",
  },
  {
    id: "define",
    text: "The name is misleading. kubectl get all only lists a small, common set of resource types in the current namespace - Pods, Services, Deployments, ReplicaSets, StatefulSets, and a few more. It deliberately skips a lot.",
  },
  {
    id: "failure",
    text: "What it misses matters. ConfigMaps and Secrets are not there. Neither are Ingresses, PersistentVolumeClaims, ServiceAccounts, Roles, or custom resources. And cluster-scoped things like Nodes and PersistentVolumes never show, because get all is namespace-scoped.",
  },
  {
    id: "check",
    text: "What beginners get wrong: trusting get all as a full audit, then missing the ConfigMap or Secret causing the problem. Or forgetting cluster-scoped resources during cleanup. Tip: kubectl api-resources lists every type; query the ones you care about.",
  },
  {
    id: "rule",
    text: "Rule to remember: get all is a shortlist, not an inventory.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
