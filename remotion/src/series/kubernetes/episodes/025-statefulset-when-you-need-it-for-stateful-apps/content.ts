import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "StatefulSet";

export const AUDIO_SRC = "audio/kubernetes/025-statefulset-when-you-need-it-for-stateful-apps.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.6;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "StatefulSet",
  "stable identity",
  "PersistentVolumeClaim",
  "ordered",
  "Deployment",
  "storage",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why aren't databases usually run with a Deployment?",
  },
  {
    id: "define",
    text: "Because a Deployment treats Pods as interchangeable cattle - random names, no stable storage, any order. A database needs identity. That is what a StatefulSet gives: stable network names like db-0, db-1, db-2, and its own persistent volume that follows each Pod across restarts.",
  },
  {
    id: "pitfall",
    text: "StatefulSets also start and scale in order. Pod zero comes up before Pod one, which matters for clustered systems that elect a primary or join members one by one. Each Pod keeps its PersistentVolumeClaim, so db-0 always reattaches to db-0 data.",
  },
  {
    id: "check",
    text: "What beginners get wrong: running Postgres in a plain Deployment, then losing data when the Pod reschedules onto another node with no volume. Or expecting a StatefulSet to auto-replicate data - it manages identity and storage, not your app's replication logic. Check kubectl get pvc for per-Pod claims.",
  },
  {
    id: "rule",
    text: "Rule to remember: stable identity plus sticky storage means StatefulSet, not Deployment.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
