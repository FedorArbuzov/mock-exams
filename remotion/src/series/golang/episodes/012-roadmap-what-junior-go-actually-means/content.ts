import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/012-roadmap-what-junior-go-actually-means.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 48.2;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "HTTP service",
  "errors",
  "modules",
  "testing",
  "goroutines",
  "interfaces",
  "context",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What skills get you hired?",
  },
  {
    id: "coreskills",
    text: "Junior Go is not memorizing syntax. It is writing a small HTTP service, handling errors explicitly, using modules cleanly, testing with the testing package, and understanding goroutines without leaking them.",
  },
  {
    id: "vocabulary",
    text: "You should read structs, slices, maps, interfaces, and context. You should debug a failing test and explain why a nil interface check lied to you.",
  },
  {
    id: "cleanrepo",
    text: "You do not need to know every stdlib package on day one. You do need to ship a repo that builds, tests, and formats cleanly.",
  },
  {
    id: "hiringbar",
    text: "Hiring bar checklist: modules, errors, interfaces, basic concurrency, one API or CLI project in Git.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
