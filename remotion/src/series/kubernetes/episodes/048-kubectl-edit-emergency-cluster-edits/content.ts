import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl edit";

export const AUDIO_SRC = "audio/kubernetes/048-kubectl-edit-emergency-cluster-edits.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.63;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl edit",
  "incident",
  "EDITOR",
  "Git",
  "drift",
  "hot-fix",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you quickly fix a resource during a prod incident?",
  },
  {
    id: "define",
    text: "kubectl edit. It opens the live object in your editor - usually via EDITOR or KUBE_EDITOR. You change a field, save, and the API updates the cluster immediately. No separate YAML file required in that moment.",
  },
  {
    id: "pitfall",
    text: "It is built for emergencies. Bump a replica count, fix a bad env var, tweak a probe timeout while users are waiting. Speed matters more than ceremony when the page is down.",
  },
  {
    id: "check",
    text: "What beginners get wrong: treating edit as the permanent source of truth. The next kubectl apply from Git can overwrite your hot-fix. Rule: edit to stop the bleeding, then copy the change back into Git and open a pull request.",
  },
  {
    id: "rule",
    text: "Rule to remember: edit is for incidents - Git is for lasting truth.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
