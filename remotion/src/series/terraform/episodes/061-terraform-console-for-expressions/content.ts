import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "console";

export const AUDIO_SRC = "audio/terraform/061-terraform-console-for-expressions.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.54;

export const HIGHLIGHT_WORDS = [
  "console",
  "expressions",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "REPL",
  chips: [
    "test",
    "type",
    "safe",
  ],
  lines: [
    "$ terraform console",
  ],
  bad: "Guess syntax",
  good: "Evaluate small",
  stamp: "TRY EXPRESSIONS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Test Terraform expressions before embedding them in a large plan." },
  { id: "explain", text: "terraform console opens an interactive evaluator for Terraform expressions in the current configuration context. It is useful for testing functions, collection transformations, conditionals, and variable shapes. It evaluates expressions but does not create, change, or destroy infrastructure." },
  { id: "detail", text: "Run it in the same directory and workspace you are debugging. Try small expressions, inspect values, and use it to understand types before writing complex locals. Exit when finished, and avoid pasting secrets because console output and terminal history may persist." },
  { id: "pitfall", text: "Console results can depend on loaded variable values and available state, so a result from one workspace may not apply elsewhere. It does not validate a complete plan or provider behavior. Treat it as an expression laboratory, not an infrastructure simulator." },
  { id: "rule", text: "Use console to test expressions, then confirm behavior with plan." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
