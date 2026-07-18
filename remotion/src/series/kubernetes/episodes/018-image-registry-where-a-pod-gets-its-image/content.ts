import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Image registry";

export const AUDIO_SRC = "audio/kubernetes/018-image-registry-where-a-pod-gets-its-image.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.32;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubelet",
  "registry",
  "image",
  "ErrImagePull",
  "ImagePullBackOff",
  "Events",
  "tag",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Where does Kubernetes actually get your container image?",
  },
  {
    id: "define",
    text: "Not from your laptop. When a Pod is scheduled to a node, the kubelet on that node reads the image field and pulls it from a registry - Docker Hub, GitHub Container Registry, ECR, GCR, or a private one. The image name encodes the registry, repository, and tag.",
  },
  {
    id: "failure",
    text: "What breaks: if the node cannot reach the registry, or the name is wrong, the Pod never starts. You see ErrImagePull, then ImagePullBackOff as Kubernetes retries with backoff. This is not a crash inside your app - the container image never arrived.",
  },
  {
    id: "check",
    text: "Practical checks: kubectl describe pod and read the Events at the bottom. They tell you the exact image reference and the pull error. Confirm the tag exists, the registry is reachable from the node, and the name has no typo.",
  },
  {
    id: "rule",
    text: "Rule to remember: ImagePullBackOff is a delivery problem, not a code problem.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
