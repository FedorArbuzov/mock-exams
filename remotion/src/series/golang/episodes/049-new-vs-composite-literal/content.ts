import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "new vs &Type{}";

export const AUDIO_SRC = "audio/golang/049-new-vs-composite-literal.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 63.34;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "new",
  "literal",
  "composite",
  "zeroed",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Which way should I allocate a pointer to a struct?",
  },
  {
    id: "bothwork",
    text: "Both new of T and address-of T with curly braces return a pointer to T. new allocates zeroed memory on the heap. Address-of T with field values is usually clearer because you see the shape right in the call — no guessing what fields start as zero.",
  },
  {
    id: "literal",
    text: "Idiomatic Go favors composite literals. Write user equals address-of User with Name Ann instead of new of User followed by field assignment. Readers see what you build without hunting two lines down. That clarity pays off in code review and onboarding.",
  },
  {
    id: "whennew",
    text: "new shines when you only need a zeroed pointer and will fill fields later, often in low-level libraries or when every field truly defaults to zero and order does not matter. Both forms escape to the heap when needed — pick for readability, not micro-optimization.",
  },
  {
    id: "style",
    text: "Style rule: prefer address-of Type with curly braces for structs you construct; reserve new for rare cases where a bare zeroed pointer is all you need.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
