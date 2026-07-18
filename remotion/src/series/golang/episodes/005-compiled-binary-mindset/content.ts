import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/005-compiled-binary-mindset.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 51.1;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "go.mod",
  "binary",
  "go build",
  "JVM",
  "GOOS",
  "GOARCH",
  "compile",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Where is my virtualenv for Go?",
  },
  {
    id: "build",
    text: "There is not one — and that is the point. Go modules track dependencies in go.mod, but the artifact you ship is a compiled binary. Run go build, copy one file to the server, done.",
  },
  {
    id: "deploys",
    text: "That changes how you think about deploys. No \"works on my machine\" Python version mismatch. No JVM tuning on every host. The binary bundles your code; the OS runs it.",
  },
  {
    id: "crossbuild",
    text: "Tradeoff: you compile per target OS and architecture when cross-building. But GOOS and GOARCH make that straightforward.",
  },
  {
    id: "mental",
    text: "Mental model: Go is compile once, ship a binary, run anywhere compatible — not install a runtime stack first.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
