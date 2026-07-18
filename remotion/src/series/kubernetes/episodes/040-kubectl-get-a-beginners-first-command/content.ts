import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl get";

export const AUDIO_SRC = "audio/kubernetes/040-kubectl-get-a-beginners-first-command.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.93;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl get",
  "namespace",
  "READY",
  "STATUS",
  "RESTARTS",
  "-o wide",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "You logged into a cluster - where do you start?",
  },
  {
    id: "define",
    text: "With kubectl get. It lists objects and their basic status, and it is the command you will run a hundred times a day. kubectl get pods shows Pods in the current namespace. Add dash A to see the whole cluster. Add dash o wide for node and IP columns.",
  },
  {
    id: "pitfall",
    text: "Learn to read the columns. For Pods: READY is containers ready over total, STATUS is the phase, RESTARTS is a warning sign, AGE tells you what is new. A high RESTARTS count usually means a crash loop worth investigating.",
  },
  {
    id: "check",
    text: "What beginners get wrong: forgetting the namespace, so get pods looks empty because the workload lives elsewhere. Or staring at one Pod when kubectl get deploy comma rs comma pods shows the whole ownership chain. Tip: dash o yaml, dash dash show-labels, and dash w watch changes live.",
  },
  {
    id: "rule",
    text: "Rule to remember: kubectl get is your eyes - always confirm the namespace first.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
