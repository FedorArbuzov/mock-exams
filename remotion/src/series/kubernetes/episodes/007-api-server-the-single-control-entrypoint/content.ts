import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "API Server";

export const AUDIO_SRC = "audio/kubernetes/007-api-server-the-single-control-entrypoint.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.9;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "API Server",
  "API server",
  "kubectl",
  "401",
  "403",
  "RBAC",
  "authenticated",
  "authorized",
  "cluster-info",
  "auth can-i",
  "Kubernetes",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Where do all your kubectl commands actually go?",
  },
  {
    id: "define",
    text: "Straight to the API server. kubectl is just a client. Every get, apply, delete, and patch request hits that one central entry point before anything changes in the cluster. The API server authenticates you, checks authorization with RBAC, validates the object schema, and only then reads from or writes to etcd. Controllers and kubelets watch the API server too. There is no hidden side channel for cluster changes.",
  },
  {
    id: "authz",
    text: "What breaks: when the API server is unreachable, kubectl fails immediately. No deploys, no scaling, no debugging through the control path. Beginners SSH into nodes and edit containers manually, which creates drift the controllers will fight later.",
  },
  {
    id: "check",
    text: "Practical check: run kubectl cluster-info. If the API endpoint fails, fix connectivity or credentials before you debug Pod logs.",
  },
  {
    id: "rule",
    text: "Rule to remember: one front door, one write path. If kubectl cannot reach the API server, the control plane is not reachable.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
