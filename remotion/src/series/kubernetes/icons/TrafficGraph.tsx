import React from "react";
import {COLORS} from "../../../shared/constants";

type TrafficGraphProps = {
  progress: number;
  width?: number;
  height?: number;
};

export const TrafficGraph: React.FC<TrafficGraphProps> = ({
  progress,
  width = 820,
  height = 220,
}) => {
  const points = Array.from({length: 24}, (_, i) => {
    const x = (i / 23) * width;
    const growth = Math.pow(Math.min(1, progress * 1.15), 1.4);
    const base = 0.18 + growth * 0.72;
    const wobble = Math.sin(i * 0.55 + progress * 4) * 0.06;
    const y = height - (base + wobble) * height * 0.85;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.cyan} stopOpacity="0.45" />
          <stop offset="100%" stopColor={COLORS.cyan} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1="0"
          x2={width}
          y1={height * g}
          y2={height * g}
          stroke={COLORS.border}
          strokeWidth="1"
        />
      ))}
      <polyline
        fill="none"
        stroke={COLORS.cyan}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        style={{filter: `drop-shadow(0 0 8px ${COLORS.cyan})`}}
      />
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#trafficFill)"
        opacity={0.85}
      />
    </svg>
  );
};
