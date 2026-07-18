import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/018-hello-world-and-why-fmt-matters.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.5;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "fmt",
  "Println",
  "Printf",
  "Sprintf",
  "verbs",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why not just print somehow?",
  },
  {
    id: "fmtbasics",
    text: "fmt is the standard formatting and printing package. fmt.Println for simple output, fmt.Printf when you need verbs like %s, %d, and %q.",
  },
  {
    id: "whyitmatters",
    text: "Learning fmt early matters because logs, errors, and debug output all reuse the same verbs. You will live in fmt.Sprintf when building error messages too.",
  },
  {
    id: "helloworldproof",
    text: "Hello World is not trivia — it proves your module, toolchain, and editor all agree.",
  },
  {
    id: "verbsexample",
    text: 'On screen try: fmt.Printf("user=%s id=%d\\n", name, id) — verbs beat string concatenation for clarity.',
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
