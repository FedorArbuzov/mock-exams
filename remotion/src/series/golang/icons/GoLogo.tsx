import React from "react";
import {COLORS} from "../../../shared/constants";

type GoLogoProps = {
  size?: number;
  glow?: boolean;
};

/** Abstract chip/circuit mark for the Go series — not the Go gopher mascot. */
export const GoLogo: React.FC<GoLogoProps> = ({size = 160, glow = true}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={glow ? {filter: `drop-shadow(0 0 18px ${COLORS.glowCyan})`} : undefined}
  >
    <rect
      x="8"
      y="8"
      width="84"
      height="84"
      rx="20"
      fill="none"
      stroke={COLORS.cyan}
      strokeWidth="4"
    />
    <path
      d="M66 36a20 20 0 1 0 0 28"
      fill="none"
      stroke={COLORS.kubernetesBlue}
      strokeWidth="7"
      strokeLinecap="round"
    />
    <path d="M62 50h12" stroke={COLORS.kubernetesBlue} strokeWidth="7" strokeLinecap="round" />
    <circle cx="50" cy="20" r="3.4" fill={COLORS.cyan} />
    <circle cx="50" cy="80" r="3.4" fill={COLORS.cyan} />
  </svg>
);
