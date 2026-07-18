import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Selectors";

export const AUDIO_SRC = "audio/kubernetes/031-selectors-how-objects-find-each-other.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.92;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "selector",
  "labels",
  "Endpoints",
  "Service",
  "Deployment",
  "empty",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How does a Service know which Pods should get traffic?",
  },
  {
    id: "define",
    text: "Selectors. A selector is a query over labels. A Service says selector app equals api, and Kubernetes continuously finds every Pod with that label and adds it to the Service's Endpoints. There is no manual wiring - matching labels is the whole mechanism.",
  },
  {
    id: "failure",
    text: "The same idea links controllers to Pods. A Deployment's selector must match the labels in its Pod template, or the API rejects it. ReplicaSets, DaemonSets, and NetworkPolicies all select by label too.",
  },
  {
    id: "check",
    text: "What breaks: the classic empty Endpoints. Your Service selector says app equals api but the Pods are labeled with different casing, or a typo. The Service has a ClusterIP and routes to nothing. Check kubectl get endpoints and compare with kubectl get pods dash dash show-labels.",
  },
  {
    id: "rule",
    text: "Rule to remember: no matching labels, no Endpoints, no traffic.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
