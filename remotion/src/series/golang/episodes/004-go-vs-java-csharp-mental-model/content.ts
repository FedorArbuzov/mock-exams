import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/004-go-vs-java-csharp-mental-model.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 50.8;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "Java",
  "structs",
  "methods",
  "interfaces",
  "composition",
  "implements",
  "error returns",
  "hierarchies",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Is Go just a simpler Java?",
  },
  {
    id: "flatten",
    text: "Partly — but the mental model is different. Go has no class inheritance, no annotations maze, and no giant frameworks baked into the culture. You model behavior with structs, methods, interfaces, and composition.",
  },
  {
    id: "implicit",
    text: "In Java you implement interfaces explicitly. In Go, if your type has the methods, it satisfies the interface — no implements keyword. That keeps APIs small and mockable.",
  },
  {
    id: "shift",
    text: "Go also pushes explicit error returns instead of exceptions, and favors flat functions over deep hierarchies. Beginner shift: stop looking for classes. Start with data structs plus small interfaces at the boundaries.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
