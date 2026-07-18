import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "CreateContainerConfigError";

export const AUDIO_SRC = "audio/kubernetes/061-createcontainerconfigerror.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 77.78;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "CreateContainerConfigError",
  "ConfigMap",
  "Secret",
  "configMapKeyRef",
  "namespace",
  "key",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Image pulled fine, but the Pod still won't start - why?",
  },
  {
    id: "define",
    text: "That is often CreateContainerConfigError. The kubelet has the image but cannot build a valid container configuration, so it never launches. The cause is almost always a missing or wrong reference in your Pod spec.",
  },
  {
    id: "failure",
    text: "The usual suspect: you reference a ConfigMap or Secret that does not exist, or a key inside it that is not there. A valueFrom with a typo triggers this instantly. Same for mounting a Secret volume never created in that namespace.",
  },
  {
    id: "check",
    text: "What beginners get wrong: confusing this with ImagePullBackOff. Here the image is fine - the config is broken. Also creating the ConfigMap in the wrong namespace. Check: describe pod names the missing object, then get configmap and secret.",
  },
  {
    id: "rule",
    text: "Rule to remember: CreateContainerConfigError means a missing ConfigMap, Secret, or key - not the image.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
