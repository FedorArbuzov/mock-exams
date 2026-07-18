import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Deployment";

export const AUDIO_SRC = "audio/kubernetes/023-deployment-the-right-way-to-run-an-app.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.46;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Deployment",
  "replicas",
  "rollout",
  "readiness",
  "rollback",
  "kubectl run",
  "template",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why shouldn't you create Pods by hand in Kubernetes?",
  },
  {
    id: "define",
    text: "Because a bare Pod has no safety net. If it dies, or its node fails, nothing brings it back. A Deployment fixes that. You declare how many replicas you want and which image to run, and the Deployment keeps that many healthy Pods alive, rescheduling them when nodes disappear.",
  },
  {
    id: "pitfall",
    text: "It also owns updates. Change the image tag and apply, and the Deployment rolls out gradually - new Pods come up, old Pods drain, and it stops if the new version fails readiness. You get rollback for free with kubectl rollout undo.",
  },
  {
    id: "check",
    text: "What beginners get wrong: running kubectl run for real apps, then wondering why traffic drops after a crash. Or editing a live Pod instead of the Deployment template, so the change vanishes on the next rollout. Check with kubectl get deployment for READY, and kubectl rollout status to watch a deploy finish.",
  },
  {
    id: "rule",
    text: "Rule to remember: never run Pods raw - let a Deployment own them.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
