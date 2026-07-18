import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/009-go-proverb-clarity-over-cleverness.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.2;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "idiomatic",
  "clear",
  "clever",
  "composition",
  "inheritance",
  "magical",
  "abstractions",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "What does idiomatic Go even mean?",
  },
  {
    id: "clearcode",
    text: "It means code a new teammate can read without decoding your personal framework. Clear names, small functions, explicit error handling, and composition over inheritance tricks.",
  },
  {
    id: "prreview",
    text: "The Go community repeats: clear is better than clever. That shows up in reviews: rejected PRs often are not wrong — they are just too magical.",
  },
  {
    id: "agesbadly",
    text: "Clever one-liners age badly. Boring code survives job changes, on-call nights, and junior contributors.",
  },
  {
    id: "dailyhabit",
    text: "Daily habit: name things for what they do, return errors instead of hiding them, and delete abstractions nobody asked for.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
