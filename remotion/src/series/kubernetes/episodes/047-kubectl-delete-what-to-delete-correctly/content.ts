import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "kubectl delete";

export const AUDIO_SRC = "audio/kubernetes/047-kubectl-delete-what-to-delete-correctly.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.22;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "kubectl delete",
  "Deployment",
  "controller",
  "ownerReferences",
  "force",
  "grace-period",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "You deleted a Pod and it came right back - why?",
  },
  {
    id: "define",
    text: "Because a controller owns it. A Deployment, ReplicaSet, StatefulSet, or DaemonSet watches desired replicas and recreates missing Pods. Deleting the Pod alone is temporary - the controller sees the gap and schedules a replacement within seconds.",
  },
  {
    id: "pitfall",
    text: "What you should delete depends on the goal. To remove an app, delete the Deployment or the owning resource, not a single Pod. To force a restart, deleting a Pod is fine - that is intentional recreation. To clean up a Job's finished Pods, delete the Job.",
  },
  {
    id: "check",
    text: "What beginners get wrong: deleting Pods in a loop fighting a Deployment, or deleting a Service but leaving the Deployment running. Also using dash dash force casually - that skips graceful shutdown. Tip: check ownerReferences, or delete the Deployment.",
  },
  {
    id: "rule",
    text: "Rule to remember: delete the controller, not the Pod, unless you want a restart.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
