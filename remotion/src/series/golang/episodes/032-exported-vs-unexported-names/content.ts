import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/032-exported-vs-unexported-names.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "exported",
  "unexported",
  "uppercase",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go has no public or private keywords. Why does capital letter matter so much?",
  },
  {
    id: "rule",
    text: "In Go, exported names start with an uppercase letter, unexported names start lowercase — that is how visibility works across packages.",
  },
  {
    id: "example",
    text: "The standard library's print function is exported, so you can call it from anywhere. A lowercase helper like parse config in another package stays invisible outside that package.",
  },
  {
    id: "notstyle",
    text: "This is not just style — it is the language itself. Capitalize that name, and suddenly it is part of your public API.",
  },
  {
    id: "apirule",
    text: "API rule: export only what callers need. Keep helpers lowercase.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
