import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "etcd";

export const AUDIO_SRC = "audio/kubernetes/008-etcd-where-cluster-state-lives.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 67.94;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "etcd",
  "API Server",
  "backup",
  "snapshot",
  "control plane",
  "cluster",
  "state",
  "memory",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Where is the source of truth for everything in your cluster?",
  },
  {
    id: "define",
    text: "etcd. It is a distributed key-value store on the control plane that holds every Kubernetes object: desired Deployments, live Pod status, Service definitions, Secrets metadata, all of it. When you kubectl apply, the API server writes your change to etcd. Controllers read through the API and react. kubelets report actual state back up, and that too lands in etcd. Desired plus actual both live here.",
  },
  {
    id: "backup",
    text: "What breaks: lose or corrupt etcd and you lose the cluster memory. Restarts without backups can mean starting from zero. Beginners treat etcd like background noise until a failed upgrade erases their entire fleet state.",
  },
  {
    id: "check",
    text: "Practical check: if the API feels broken after a control plane restart, verify etcd member Pods are Running in kube-system before blaming workloads.",
  },
  {
    id: "rule",
    text: "Rule to remember: etcd is the source of truth. Backup etcd before you need to prove it.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
