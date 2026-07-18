import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "ConfigMap";

export const AUDIO_SRC = "audio/kubernetes/033-configmap-external-configuration.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 76.61;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "ConfigMap",
  "envFrom",
  "volume",
  "restart",
  "plain text",
  "rollout",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why should configuration live outside your container image?",
  },
  {
    id: "define",
    text: "Because baking config into the image means a rebuild for every setting change, and the same image cannot move cleanly between dev and prod. A ConfigMap fixes that. It stores non-secret settings - URLs, feature flags, whole config files - as key/value data the cluster owns.",
  },
  {
    id: "pitfall",
    text: "You consume it two ways: as environment variables with envFrom or valueFrom, or mounted as files in a volume. Mounting is handy for full config files an app reads at startup.",
  },
  {
    id: "check",
    text: "What beginners get wrong: expecting a Pod to pick up ConfigMap changes instantly. Env vars are injected only at container start, so a change needs a rollout. Mounted files update eventually, but the app must re-read them. And ConfigMaps are not for secrets - values are plain text.",
  },
  {
    id: "rule",
    text: "Rule to remember: config outside the image - but env changes need a restart.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
