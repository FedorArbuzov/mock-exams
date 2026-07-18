import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/001-what-is-go-in-30-seconds.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 49.6;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "compiled",
  "go build",
  "binary",
  "JVM",
  "interpreter",
  "Kubernetes",
  "Docker",
  "Terraform",
  "concurrency",
  "production",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Another language — why should I care about Go?",
  },
  {
    id: "compiled",
    text: "Go is a compiled language built for backend services, CLIs, and infrastructure tooling. You write straightforward code, run go build, and ship a single binary. No JVM, no interpreter on the server, no dependency drama at deploy time.",
  },
  {
    id: "teams",
    text: "Teams pick Go when they want fast builds, readable concurrency, and a strong standard library. Kubernetes, Docker, Terraform, and countless APIs are written in Go — not because it is trendy, but because it stays boring in production.",
  },
  {
    id: "mental",
    text: "Beginner mental model: Go is not a research language. It is a tool for shipping reliable network software with a small team vocabulary.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
