import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "get events sort-by";

export const AUDIO_SRC = "audio/kubernetes/067-kubectl-get-events-sorted-by-time.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.54;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "get events",
  "sort-by",
  "lastTimestamp",
  "FailedScheduling",
  "namespaced",
  "expire",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do you see fresh events instead of a jumbled mess?",
  },
  {
    id: "define",
    text: "kubectl get events dash dash sort-by equals dot lastTimestamp. By default events come back in a confusing order; during an incident you want the newest failure reasons at the bottom, right where your eyes land. Sorting by time gives a clean timeline.",
  },
  {
    id: "pitfall",
    text: "Events are the cluster's short-term memory: FailedScheduling, Pulling, Failed, Unhealthy, Killing, BackOff. Read in time order, they tell the story of what the scheduler and kubelet just did.",
  },
  {
    id: "check",
    text: "What beginners get wrong: reading unsorted events and misjudging order. Or forgetting events are namespaced - add dash A - and that they expire after about an hour, so a quiet list can mean the failure aged out.",
  },
  {
    id: "rule",
    text: "Rule to remember: sort events by time - the latest reasons are what you actually need.",
  },
  {
    id: "cta",
    text: "Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
