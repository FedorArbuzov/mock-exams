import React from "react";
import {COLORS} from "../../../shared/constants";

type KubernetesLogoProps = {
  size?: number;
  glow?: boolean;
};

export const KubernetesLogo: React.FC<KubernetesLogoProps> = ({
  size = 160,
  glow = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={glow ? {filter: `drop-shadow(0 0 18px ${COLORS.glowBlue})`} : undefined}
  >
    <polygon
      points="50,6 90,28 90,72 50,94 10,72 10,28"
      fill="none"
      stroke={COLORS.kubernetesBlue}
      strokeWidth="4"
    />
    <circle cx="50" cy="50" r="14" fill={COLORS.kubernetesBlue} />
    {[0, 60, 120, 180, 240, 300].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x = 50 + Math.cos(rad) * 28;
      const y = 50 + Math.sin(rad) * 28;
      return <circle key={deg} cx={x} cy={y} r="4.5" fill={COLORS.cyan} />;
    })}
  </svg>
);
