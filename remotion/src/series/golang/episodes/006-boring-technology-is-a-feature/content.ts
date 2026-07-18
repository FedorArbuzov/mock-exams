import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/006-boring-technology-is-a-feature.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 50.5;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "readability",
  "cleverness",
  "inheritance",
  "operator overloading",
  "gofmt",
  "dialect wars",
  "distributed systems",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why does Go feel plain on purpose?",
  },
  {
    id: "omits",
    text: "Because teams pay for readability over cleverness. Go deliberately omits many features other languages celebrate: no inheritance trees, limited operator overloading, opinionated formatting with gofmt.",
  },
  {
    id: "teamstyle",
    text: "That sounds limiting until you join a codebase with ten authors. Everyone writes similar-looking code. Reviews focus on logic, not dialect wars.",
  },
  {
    id: "scale",
    text: "Boring does not mean weak. Go powers massive distributed systems. It just refuses to let every engineer invent a personal style.",
  },
  {
    id: "rule",
    text: "Practical rule: if you reach for a clever abstraction, ask whether a plain function and a struct would be clearer to the next reader.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
