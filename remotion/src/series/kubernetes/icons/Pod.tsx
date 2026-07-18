import React from "react";
import {COLORS} from "../../../shared/constants";

type PodProps = {
  label?: string;
  status?: "healthy" | "crashed" | "pending" | "new";
  width?: number;
  height?: number;
  style?: React.CSSProperties;
};

const statusColor = {
  healthy: COLORS.green,
  crashed: COLORS.red,
  pending: COLORS.muted,
  new: COLORS.cyan,
};

export const Pod: React.FC<PodProps> = ({
  label = "pod",
  status = "healthy",
  width = 150,
  height = 110,
  style,
}) => {
  const color = statusColor[status];
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 18,
        border: `2px solid ${color}`,
        background: "rgba(8, 14, 28, 0.92)",
        boxShadow: `0 0 24px ${color}55`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
    >
      <svg width="42" height="42" viewBox="0 0 48 48" fill="none">
        <ellipse cx="24" cy="14" rx="14" ry="6" stroke={color} strokeWidth="2.5" />
        <path
          d="M10 14v12c0 3.3 6.3 6 14 6s14-2.7 14-6V14"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M10 26v8c0 3.3 6.3 6 14 6s14-2.7 14-6v-8"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
      </svg>
      <div style={{color, fontSize: 22, fontWeight: 700, letterSpacing: 0.3}}>{label}</div>
    </div>
  );
};
