export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** CTA/branding words highlighted in captions on every episode, every series. */
export const BASE_HIGHLIGHT_WORDS = [
  "Link in Bio",
  "link in bio",
  "Theory",
  "Hands-on",
  "Labs",
  "Interview",
  "Questions",
  "exallenge.tech",
] as const;

export const COLORS = {
  background: "#0B1020",
  backgroundAlt: "#111827",
  kubernetesBlue: "#326CE5",
  cyan: "#22D3EE",
  green: "#34D399",
  red: "#F87171",
  white: "#F8FAFC",
  muted: "#94A3B8",
  card: "rgba(15, 23, 42, 0.88)",
  border: "rgba(148, 163, 184, 0.28)",
  glowCyan: "rgba(34, 211, 238, 0.35)",
  glowGreen: "rgba(52, 211, 153, 0.35)",
  glowBlue: "rgba(50, 108, 229, 0.4)",
} as const;

export const FONTS = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

export const SPACING = {
  screenPadX: 64,
  screenPadY: 120,
  cardRadius: 22,
  gap: 18,
} as const;

export const ANIM = {
  enterSpring: {damping: 18, stiffness: 120, mass: 0.8},
  softSpring: {damping: 22, stiffness: 90, mass: 0.9},
  floatAmplitude: 8,
  floatPeriod: 90,
} as const;
