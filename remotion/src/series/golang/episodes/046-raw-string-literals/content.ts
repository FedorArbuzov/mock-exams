import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/046-raw-string-literals.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.46;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "raw",
  "backticks",
  "regex",
  "backslash",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How do I paste a multiline file path or regex without escape nightmares?",
  },
  {
    id: "raw",
    text: "Use raw string literals - wrap the text in backticks. Backslashes stay literal, newlines stay real, and Windows paths like C colon backslash Users backslash app read exactly as typed. Perfect for regex patterns, SQL templates, and test fixtures with long multiline input. Copy a path from Explorer, drop it in backticks, and it just works.",
  },
  {
    id: "quoted",
    text: "Regular double-quoted strings interpret backslash n as a newline and backslash t as a tab. Fine for short messages like hello world, painful when every path separator needs doubling and your regex looks like abstract art.",
  },
  {
    id: "edge",
    text: "One limit - you cannot put a backtick inside a raw string. For that rare case, fall back to double quotes or build the string from parts. Everything else belongs in backticks.",
  },
  {
    id: "rule",
    text: "Rule - paste paths, regex, and multiline SQL in raw strings so you stop fighting backslash hell.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
