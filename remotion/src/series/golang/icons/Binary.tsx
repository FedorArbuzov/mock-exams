import React from "react";
import {COLORS} from "../../../shared/constants";

type BinaryProps = {
  label?: string;
  size?: number;
  active?: boolean;
  style?: React.CSSProperties;
};

export const Binary: React.FC<BinaryProps> = ({
  label = "binary",
  size = 130,
  active = true,
  style,
}) => {
  const color = active ? COLORS.cyan : COLORS.muted;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 18,
        border: `2px solid ${color}`,
        background: COLORS.card,
        boxShadow: active ? `0 0 24px ${COLORS.glowCyan}` : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
    >
      <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
        <path
          d="M24 6l16 9v18l-16 9-16-9V15z"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M24 6v18M24 24l16-9M24 24L8 15" stroke={color} strokeWidth="2" opacity="0.7" />
      </svg>
      <div style={{color, fontSize: 18, fontWeight: 650}}>{label}</div>
    </div>
  );
};
