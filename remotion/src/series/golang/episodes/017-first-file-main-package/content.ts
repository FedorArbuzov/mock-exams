import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/017-first-file-main-package.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "func main",
  "package main",
  "go build",
  "go run",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Where does execution start?",
  },
  {
    id: "entrypoint",
    text: "In a runnable program, execution starts at func main in package main. That is the only package name allowed to produce a binary with go build.",
  },
  {
    id: "otherpackages",
    text: "Other packages are libraries. They compile into your program but do not run by themselves. So every CLI and service begins with package main and a main function.",
  },
  {
    id: "errormessage",
    text: "If you see cannot find package main or main is not in package main, you are building the wrong directory or missing func main.",
  },
  {
    id: "skeleton",
    text: "Starter skeleton: package main, import fmt, func main with your first println — then go run .",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
