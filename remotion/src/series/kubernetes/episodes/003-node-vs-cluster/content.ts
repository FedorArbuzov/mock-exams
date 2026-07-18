import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/kubernetes/003-node-vs-cluster.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 59.18;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Node",
  "node",
  "Cluster",
  "cluster",
  "kubelet",
  "Control",
  "Plane",
  "Capacity",
  "capacity",
  "Placement",
  "placement",
  "Networking",
  "networking",
  "Recovery",
  "recovery",
  "Orchestration",
  "orchestration",
  "Kubernetes",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Are node and cluster the same thing?",
  },
  {
    id: "define",
    text: "No. A node is one worker machine: virtual machine or bare metal, with CPU, memory, disk, and a kubelet agent. A cluster is many nodes plus a control plane that treats them as one system.",
  },
  {
    id: "placement",
    text: "Your containers do not run on Kubernetes in the abstract. They run on a specific node. The cluster is the pool of capacity and the policy layer that decides placement, networking, and recovery.",
  },
  {
    id: "failure",
    text: "If one node fails, the cluster can still be healthy. If the control plane fails, workers may keep running old workloads, but you lose the ability to change desired state safely.",
  },
  {
    id: "model",
    text: "Beginner mental model: node equals capacity. Cluster equals orchestration. Always ask both: is the app broken, or is the node under pressure?",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
