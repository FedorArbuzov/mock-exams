import React from "react";
import {COLORS} from "../constants";

type CheckmarkProps = {
  size?: number;
  progress?: number;
};

export const Checkmark: React.FC<CheckmarkProps> = ({size = 84, progress = 1}) => {
  const dash = 60;
  return (
    <svg width={size} height={size} viewBox="0 0 84 84">
      <circle
        cx="42"
        cy="42"
        r="30"
        fill="none"
        stroke={COLORS.green}
        strokeWidth="4"
        opacity={0.35 + progress * 0.65}
        style={{filter: `drop-shadow(0 0 10px ${COLORS.green})`}}
      />
      <path
        d="M26 43l10 10 22-24"
        fill="none"
        stroke={COLORS.green}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash}
        strokeDashoffset={dash * (1 - progress)}
      />
    </svg>
  );
};
