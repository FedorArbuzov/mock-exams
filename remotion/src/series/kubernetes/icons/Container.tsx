import React from "react";
import {COLORS} from "../../../shared/constants";

type ContainerProps = {
  label?: string;
  size?: number;
  active?: boolean;
  style?: React.CSSProperties;
};

export const Container: React.FC<ContainerProps> = ({
  label = "container",
  size = 120,
  active = false,
  style,
}) => {
  const color = active ? COLORS.cyan : COLORS.muted;
  return (
    <div
      style={{
        width: size,
        height: size * 0.95,
        borderRadius: 16,
        border: `2px solid ${color}`,
        background: COLORS.card,
        boxShadow: active ? `0 0 22px ${COLORS.glowCyan}` : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        ...style,
      }}
    >
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="10" width="32" height="28" rx="6" stroke={color} strokeWidth="2.5" />
        <path d="M8 20h32M24 10v28" stroke={color} strokeWidth="2" opacity="0.7" />
        <circle cx="14" cy="15" r="1.8" fill={color} />
        <circle cx="20" cy="15" r="1.8" fill={color} />
      </svg>
      <div style={{color, fontSize: 18, fontWeight: 650}}>{label}</div>
    </div>
  );
};
