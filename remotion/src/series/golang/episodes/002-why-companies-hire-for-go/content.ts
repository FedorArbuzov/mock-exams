import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/002-why-companies-hire-for-go.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 52.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Go",
  "Uber",
  "Cloudflare",
  "Dropbox",
  "Twitch",
  "goroutines",
  "goroutine leak",
  "CI",
  "binary",
  "concurrency",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Is Go only for Google?",
  },
  {
    id: "companies",
    text: "No. Uber, Cloudflare, Dropbox, and Twitch all run Go in production, alongside countless smaller platform teams — not as an experiment, but as the default choice for services that must stay up.",
  },
  {
    id: "fastci",
    text: "Go compiles in seconds, ships a single static binary, and gives you goroutines without a heavyweight runtime. That means faster CI, dead-simple deploys, and no surprise dependency conflicts at 3 a.m.",
  },
  {
    id: "interview",
    text: "In an interview, this shows up as a concrete signal: can you explain a goroutine leak, or why a service restarts cleanly after a crash? That is what a hiring manager is actually screening for.",
  },
  {
    id: "takeaway",
    text: "Learn Go if you want to build services that ship as one binary and handle real concurrency without drama.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
