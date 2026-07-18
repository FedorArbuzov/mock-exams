import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/014-goroot-vs-gopath-today.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 46.5;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "GOPATH",
  "GOROOT",
  "modules",
  "go.mod",
  "go mod init",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Do I still need to fight GOPATH?",
  },
  {
    id: "modules",
    text: "Mostly no. Modules made projects self-contained: your code lives anywhere, and go.mod declares dependencies. GOPATH still exists as a cache and workspace concept, but you do not put all projects under ~/go/src anymore.",
  },
  {
    id: "rootpath",
    text: "GOROOT is where the Go toolchain itself lives. You rarely touch it. GOPATH is where modules are downloaded and cached. Go modules live beside your source.",
  },
  {
    id: "oldtutorial",
    text: "Confusion hits when tutorials from 2017 tell you to mkdir GOPATH/src/github.com/you. Ignore that for new projects.",
  },
  {
    id: "modernrule",
    text: "Modern rule: create a folder, go mod init, write code — modules handle the rest.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
