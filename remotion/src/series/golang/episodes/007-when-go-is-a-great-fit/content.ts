import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/007-when-go-is-a-great-fit.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 46.2;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "CLIs",
  "APIs",
  "workers",
  "proxies",
  "goroutine",
  "concurrent",
  "network-bound",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What projects deserve Go first?",
  },
  {
    id: "sweetspots",
    text: "CLIs, HTTP APIs, background workers, proxies, and Kubernetes-adjacent tooling are sweet spots. Anything that needs lots of concurrent I/O — requests, queues, streams — fits Go's goroutine model well.",
  },
  {
    id: "platformtools",
    text: "Go also shines for internal platform tools: deploy agents, log forwarders, small services that must start fast and use little memory.",
  },
  {
    id: "lesscommon",
    text: "You will see Go less often in rich desktop GUIs, heavy ML training, or domains where another ecosystem already owns the libraries.",
  },
  {
    id: "quickfilter",
    text: "Quick filter: if the job is network-bound, long-running, and team-maintained, Go is probably a strong choice.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
