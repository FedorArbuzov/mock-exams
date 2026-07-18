import React from "react";
import {COLORS} from "../constants";

type ArrowProps = {
  direction?: "up" | "down" | "left" | "right";
  color?: string;
  size?: number;
  style?: React.CSSProperties;
};

const rotation = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

export const Arrow: React.FC<ArrowProps> = ({
  direction = "up",
  color = COLORS.cyan,
  size = 56,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    style={{transform: `rotate(${rotation[direction]}deg)`, ...style}}
  >
    <path
      d="M24 38V12M24 12l-10 10M24 12l10 10"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      style={{filter: `drop-shadow(0 0 6px ${color})`}}
    />
  </svg>
);
