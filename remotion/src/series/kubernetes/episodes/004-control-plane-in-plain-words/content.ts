import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Control Plane";

export const AUDIO_SRC = "audio/kubernetes/004-control-plane-in-plain-words.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.78;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Control Plane",
  "control plane",
  "API server",
  "etcd",
  "scheduler",
  "controller",
  "desired state",
  "kubectl",
  "kube-system",
  "worker",
  "reconcile",
  "Kubernetes",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Who makes decisions in a Kubernetes cluster?",
  },
  {
    id: "define",
    text: "The control plane is the brain. It includes the API server as the front door, etcd storing cluster state, the scheduler placing new Pods, and controllers like the Deployment controller keeping replica counts right. Worker nodes are the muscle: they run containers but do not set cluster-wide policy. When the control plane is healthy, you apply YAML and these parts cooperate. The API server validates your request, etcd persists it, controllers notice the change, and instructions reach nodes through each kubelet.",
  },
  {
    id: "failure",
    text: "What breaks: control plane failure is different from a broken app. Workers may keep running existing Pods, but kubectl apply fails and new work cannot schedule safely. Beginners say \"Kubernetes is down\" when they actually lost the brain, not a single Pod.",
  },
  {
    id: "check",
    text: "Quick check: run kubectl get nodes. If nodes look Ready but apply keeps failing, inspect control plane Pods in kube-system before debugging application logs.",
  },
  {
    id: "rule",
    text: "Rule to remember: the control plane decides and reconciles. Worker nodes execute.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
