import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kind / minikube / k3s";

export const AUDIO_SRC = "audio/kubernetes/013-minikube-kind-k3s-what-a-beginner-should-pick.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 67.9;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kind",
  "minikube",
  "k3s",
  "local cluster",
  "kubeconfig",
  "Docker",
  "kubectl",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Which local cluster should you install without getting lost?",
  },
  {
    id: "define",
    text: "Three common picks. kind runs Kubernetes nodes as Docker containers - fast, disposable, great for CI and learning kubectl. Minikube focuses on a friendly local developer experience with addons. k3s is a lightweight distribution that feels closer to a small production box.",
  },
  {
    id: "pick",
    text: "What beginners get wrong: installing all three, then mixing kubeconfigs until nothing works. Pick one path for the next two weeks. For most learning demos, kind is enough: create cluster, get nodes Ready, apply a Deployment, delete the cluster when done.",
  },
  {
    id: "check",
    text: "Practical tip: if Docker Desktop already works on your laptop, start with kind. If you want a single binary on a cheap VM, try k3s later. Do not chase every tool before you can read kubectl get pods.",
  },
  {
    id: "rule",
    text: "Rule to remember: one local cluster tool, mastered, beats three half-installed.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
