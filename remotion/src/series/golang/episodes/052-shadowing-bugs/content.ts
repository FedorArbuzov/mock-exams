import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Variable Shadowing";

export const AUDIO_SRC = "audio/golang/052-shadowing-bugs.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.84;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "shadowing",
  "err",
  "outer",
  "inner",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why did my outer err never update after the check?",
  },
  {
    id: "trap",
    text: "Because short declaration declared a new err inside the if block, shadowing the outer one. The outer err stayed nil while the inner err held the real failure — so your caller never saw the error you thought you handled. The code compiles cleanly, which makes this bug especially sneaky.",
  },
  {
    id: "fix",
    text: "Classic bug: if err short-declare do open-paren close-paren semicolon err not equal nil when err was already declared outside. Use equals instead of short declaration when assigning to an existing err variable. The fix is one character, but you have to notice the shadow first.",
  },
  {
    id: "loops",
    text: "Shadowing also hits loop variables and short declarations in inner scopes. Any time you reuse a name with short declaration inside a narrower block, you may hide the outer binding without a compile error. Go vet and staticcheck can catch some cases — run them in CI.",
  },
  {
    id: "habit",
    text: "Fix habit: error handling blocks often want equals err equals do open-paren close-paren, not short declaration, when err already exists in the outer scope.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
