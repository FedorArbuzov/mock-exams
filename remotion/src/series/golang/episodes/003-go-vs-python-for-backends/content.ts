import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/003-go-vs-python-for-backends.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 54.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "Python",
  "static types",
  "concurrency",
  "goroutines",
  "channels",
  "compile time",
  "runtime",
  "Django",
  "FastAPI",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "I know Python — why switch?",
  },
  {
    id: "tradeoff",
    text: "Python wins when you need speed of experimentation: notebooks, data pipelines, quick CRUD with Django or FastAPI. Go wins when you need predictable performance, static types, and a concurrency model that does not fight you at scale.",
  },
  {
    id: "compiletime",
    text: "In Python, a typo might surface at runtime. In Go, many bugs fail at compile time. In Python, scaling often means more processes and careful async. In Go, goroutines and channels are first-class.",
  },
  {
    id: "coexist",
    text: "You do not have to abandon Python. But for long-running APIs and infra tools, Go reduces operational weight.",
  },
  {
    id: "ruleofthumb",
    text: "Rule of thumb: prototype in Python if the domain fits; ship core services in Go when reliability and deploy simplicity matter.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
