import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/013-install-go-the-clean-way.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 46.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "go.dev",
  "MSI",
  "go version",
  "GOROOT",
  "PATH",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Which installer should I trust?",
  },
  {
    id: "source",
    text: "Download Go from go.dev — the official toolchain. On Windows use the MSI installer or the official archive. On macOS, the pkg from go.dev beats random Homebrew forks for beginners.",
  },
  {
    id: "versioncheck",
    text: "After install, open a new terminal and run go version. You want a recent stable release, not a random nightly.",
  },
  {
    id: "onepath",
    text: "Avoid mixing multiple Go installs unless you know what GOROOT means. One clean install saves hours of PATH confusion.",
  },
  {
    id: "firsthour",
    text: "First-hour check: go version works, go env GOROOT points at that install, and your editor sees the same binary.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
