import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Pointer vs Value";

export const AUDIO_SRC = "audio/golang/048-when-to-pass-pointer-vs-value.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.93;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "pointer",
  "value",
  "receiver",
  "mutate",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Should everything be a pointer in Go?",
  },
  {
    id: "heuristic",
    text: "No. Values are the default because they are simple, safe, and cheap for small data. The caller gets an independent copy, so there are no surprise mutations through hidden shared state. Pass a pointer when you need to mutate the caller's data, when the struct is large and copying wastes memory and CPU, or when nil means something meaningful like optional fields in JSON APIs.",
  },
  {
    id: "methods",
    text: "For methods, use pointer receivers when the method mutates state or the struct is big. Value receivers work fine for tiny immutable types and read-only operations where copying costs almost nothing. Consistency matters too — if one method on a type uses a pointer receiver, the rest usually should as well.",
  },
  {
    id: "overuse",
    text: "The failure mode is pointer everything — nil checks everywhere, escape analysis gets harder, and readability drops fast. Start with a value. Reach for a pointer only when you have a concrete reason, not by default.",
  },
  {
    id: "rule",
    text: "Rule: small and read-only — value. Mutate, large, or optional nil — pointer.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
