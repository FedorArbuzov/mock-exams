import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Defined Types";

export const AUDIO_SRC = "audio/golang/050-type-aliases-vs-defined-types.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.38;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "defined",
  "alias",
  "UserID",
  "distinct",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why create type UserID int when int already works?",
  },
  {
    id: "defined",
    text: "Because defined types are distinct at compile time. You cannot pass a plain int where a UserID is required, even though both are ints under the hood. That catches mixing order IDs with user IDs before the bug reaches production — the compiler rejects the call instead of corrupting data silently.",
  },
  {
    id: "alias",
    text: "A type alias — type Alias equals int — is just another name for the exact same type. Aliases help migration and readability during refactors but do not add any type safety. Old and new names are interchangeable everywhere, which is exactly why you should not use aliases to model domain concepts.",
  },
  {
    id: "domain",
    text: "Use defined types when the name carries domain meaning: UserID, OrderID, cents, meters. They document intent in signatures and prevent accidental cross-wiring. Use aliases for API compatibility or legacy renames, not for catching logic mistakes.",
  },
  {
    id: "rule",
    text: "Rule: distinct meaning in your domain — defined type. Same type, new name during refactor — alias.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
