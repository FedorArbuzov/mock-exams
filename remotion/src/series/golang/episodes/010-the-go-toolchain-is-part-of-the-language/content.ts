import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/010-the-go-toolchain-is-part-of-the-language.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 46.1;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "go",
  "gofmt",
  "vet",
  "test",
  "toolchain",
  "go mod",
  "go build",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Is go just a compiler?",
  },
  {
    id: "workflow",
    text: "No. The go command is your whole workflow: go run for quick tries, go build for binaries, go test for tests, go fmt for formatting, go vet for common bugs, and go mod for dependencies.",
  },
  {
    id: "integration",
    text: "That integration matters. You do not argue about formatters in every repo — gofmt is the law. You do not hunt for ten tools — the toolchain ships together.",
  },
  {
    id: "learnearly",
    text: "Learn the commands early. Seniors assume you run vet and test before every push.",
  },
  {
    id: "startertrio",
    text: "Starter trio: go fmt ./..., go vet ./..., go test ./... — make them muscle memory.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
