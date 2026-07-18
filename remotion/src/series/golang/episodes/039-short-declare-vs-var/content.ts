import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/039-short-declare-vs-var.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.03;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "short declaration",
  "var",
  "zero value",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Which declaration should I use - short declaration or var?",
  },
  {
    id: "usage",
    text: "Inside a function, use short declaration - colon-equals - when you create and assign in one step. Count equals ten reads fast and keeps locals obvious. Use var when you need the zero value before any logic runs, or when you declare several variables together on one line.",
  },
  {
    id: "scoping",
    text: "The scoping trap bites beginners hard. If count already exists in an outer scope, short declaration inside an if block does not update that outer count. It creates a brand new count that shadows the original. Your outer counter stays frozen while the inner one changes. Use a plain equals assignment when you mean to update an existing variable.",
  },
  {
    id: "packagelevel",
    text: "At package level, short declaration is illegal. Every package variable must use var or const. That rule keeps package state visible and consistent across every file in the same package.",
  },
  {
    id: "style",
    text: "Style rule - short declaration for locals, var when you need a zero value first, and never short declaration at package scope.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
