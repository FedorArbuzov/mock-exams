import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/kubernetes/002-container-vs-pod.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 60.55;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Kubernetes",
  "Pod",
  "Pods",
  "Container",
  "Containers",
  "container",
  "containers",
  "IP",
  "Network",
  "network",
  "Volumes",
  "volumes",
  "Sidecar",
  "sidecar",
  "proxy",
  "localhost",
  "Deployment",
  "Deployments",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why does Kubernetes say Pod instead of just container?",
  },
  {
    id: "schedule",
    text: "Because Kubernetes does not schedule containers directly. It schedules Pods. A Pod is the smallest deployable unit: one IP, one shared network namespace, and optional shared volumes.",
  },
  {
    id: "multicontainer",
    text: "Most Pods run a single container. That is normal. Multi-container Pods exist when helpers must share fate with the app: a log sidecar, a proxy, or an init-style companion that needs the same localhost and disk.",
  },
  {
    id: "rule",
    text: "Practical rule: one Pod equals one colocated unit of work. If two processes must share localhost ports or a local volume, they belong in one Pod. If they scale independently, they should be separate Pods behind separate Deployments.",
  },
  {
    id: "diagnose",
    text: "When someone says the container restarted, ask: which Pod, which container inside it, and who owns that Pod?",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
