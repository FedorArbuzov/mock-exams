import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Worker Node";

export const AUDIO_SRC = "audio/kubernetes/005-worker-node-and-its-role.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.3;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Worker Node",
  "worker node",
  "node",
  "kubelet",
  "CPU",
  "memory",
  "MemoryPressure",
  "DiskPressure",
  "Pending",
  "Evicted",
  "Ready",
  "kubectl",
  "Kubernetes",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Where does your application actually run?",
  },
  {
    id: "define",
    text: "Not on the control plane. Not on \"Kubernetes\" as an abstract cloud. Your app runs on a worker node: a real machine with CPU, memory, disk, a kubelet agent, and a container runtime like containerd. The control plane decides what should run and where. The worker node makes it happen. It pulls images, starts containers, mounts volumes, and reports status back up to the API server.",
  },
  {
    id: "pressure",
    text: "What breaks: a worker node can flip to NotReady when the kubelet stops, the disk fills up, or memory pressure evicts Pods. Your Deployment may look fine in YAML while every Pod on that node is gone. Beginners chase application bugs when the node itself is sick.",
  },
  {
    id: "check",
    text: "Practical check: kubectl get nodes. If STATUS is NotReady or you see MemoryPressure or DiskPressure, run kubectl describe node and read the Conditions section first.",
  },
  {
    id: "rule",
    text: "Memorable rule: worker nodes are where containers live. Always ask: which node is hosting this Pod?",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
