import { type ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: "primary" | "success" | "neutral";
};

const tones = {
  primary:
    "border-primary/25 bg-primary/10 text-primary",
  success:
    "border-success/25 bg-success/10 text-success",
  neutral:
    "border-white/10 bg-white/[0.04] text-muted",
};

export function Badge({
  children,
  className = "",
  tone = "primary",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
