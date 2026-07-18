import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubelet";

export const AUDIO_SRC = "audio/kubernetes/006-kubelet-who-runs-pods-on-a-node.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.53;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubelet",
  "NotReady",
  "Ready",
  "container runtime",
  "API server",
  "Pod",
  "node",
  "systemctl",
  "journalctl",
  "scheduler",
  "Kubernetes",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What on the node actually watches your Pod?",
  },
  {
    id: "define",
    text: "The kubelet. It is a daemon on every worker node that talks to the API server, receives PodSpecs, and tells the container runtime to start, stop, or restart containers locally. When you kubectl apply a Deployment, the control plane decides a Pod should exist on node B. The kubelet on node B notices that assignment, pulls the image, creates the container, mounts volumes, runs health probes, and reports Running or CrashLoopBackOff back to the API server.",
  },
  {
    id: "notready",
    text: "What breaks: if the kubelet dies on a node, that node goes NotReady. Every Pod on it becomes orphaned to the cluster even if a container process is still alive on disk. Beginners delete and recreate Pods remotely when the local agent is broken.",
  },
  {
    id: "check",
    text: "Practical check: kubectl get nodes and look for NotReady. Then kubectl describe node and read kubelet conditions plus events at the bottom.",
  },
  {
    id: "rule",
    text: "Rule to remember: the scheduler picks the node. The kubelet runs the Pod there.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
