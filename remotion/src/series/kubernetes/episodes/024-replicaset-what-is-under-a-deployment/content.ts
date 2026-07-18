import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "ReplicaSet";

export const AUDIO_SRC = "audio/kubernetes/024-replicaset-what-is-under-a-deployment.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.15;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "ReplicaSet",
  "Deployment",
  "replicas",
  "rolling update",
  "revision",
  "rollback",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "When you create a Deployment, who keeps the Pod count right?",
  },
  {
    id: "define",
    text: "A ReplicaSet. The Deployment is the manager that handles versions and rollouts, but under the hood it creates a ReplicaSet, and that ReplicaSet is the controller watching the number of Pods. If you ask for three and one dies, the ReplicaSet notices two Running and creates a replacement.",
  },
  {
    id: "pitfall",
    text: "Here is the part that confuses people: during a rolling update you briefly have two ReplicaSets. The old one scales down while the new one scales up. That is why kubectl get replicasets sometimes shows several, most with zero Pods - those are previous revisions kept for rollback.",
  },
  {
    id: "check",
    text: "What beginners get wrong: deleting a ReplicaSet directly, or scaling it, while the Deployment owns it. The Deployment just recreates or overrides your change, because desired state lives one level up. Use kubectl get rs to see revisions - let the Deployment drive.",
  },
  {
    id: "rule",
    text: "Rule to remember: Deployment manages versions, ReplicaSet guards the count.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
