import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "ImagePullSecrets";

export const AUDIO_SRC = "audio/kubernetes/019-imagepullsecrets-private-registry.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.36;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "imagePullSecrets",
  "Secret",
  "ServiceAccount",
  "private registry",
  "namespace",
  "ImagePullBackOff",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How does a Pod pull from a private registry?",
  },
  {
    id: "define",
    text: "By default the kubelet only pulls public images. For a private registry you create a docker-registry Secret that holds the login, then reference it. You can attach it per Pod with imagePullSecrets, or add it to a ServiceAccount so every Pod using that account inherits access.",
  },
  {
    id: "failure",
    text: "What breaks: people push to a private repo, apply the Deployment, and get ImagePullBackOff with an authentication or not found error. The image exists - the node just has no credentials. Or the Secret lives in the wrong namespace, because pull Secrets are namespaced.",
  },
  {
    id: "check",
    text: "Practical steps: create the Secret with kubectl create secret docker-registry, in the same namespace as the Pod. Reference it under imagePullSecrets in the Pod spec, or patch the default ServiceAccount. Then kubectl describe pod to confirm the pull now succeeds.",
  },
  {
    id: "rule",
    text: "Rule to remember: private image, no Secret in the right namespace, no Pod.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
