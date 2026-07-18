import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Scheduler";

export const AUDIO_SRC = "audio/kubernetes/009-scheduler-how-a-node-is-chosen.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.71;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Scheduler",
  "Pending",
  "node",
  "taints",
  "tolerations",
  "affinity",
  "Events",
  "resources",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why did this Pod land on that specific node?",
  },
  {
    id: "define",
    text: "Because the scheduler chose it. After you apply a Pod with no nodeName set, it sits Pending until the scheduler filters all nodes by CPU, memory, taints, tolerations, affinities, and topology rules, then scores the survivors and picks one. The scheduler only assigns. It does not start containers. The kubelet on the winning node picks up the Pod and runs it.",
  },
  {
    id: "pending",
    text: "What breaks: Pods stuck Pending usually mean no node fits. Maybe every node lacks memory, a required nodeSelector does not match, or a taint blocks scheduling. Adding more nodes will not help if affinity rules exclude them. Beginners kubectl delete the Pod repeatedly, but the constraint never changed.",
  },
  {
    id: "check",
    text: "Practical check: kubectl describe pod and scroll to Events. You will see messages like Insufficient cpu or did not tolerate taint.",
  },
  {
    id: "rule",
    text: "Rule to remember: Pending without a nodeName means ask the scheduler, not the kubelet.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
