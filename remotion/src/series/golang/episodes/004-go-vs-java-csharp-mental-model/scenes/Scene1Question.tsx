import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {fadeSlideUp, pulse} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const NODES = [
  {x: 540, y: 640, w: 160, h: 70},
  {x: 420, y: 800, w: 150, h: 66},
  {x: 620, y: 960, w: 140, h: 62},
];

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const glow = pulse(frame, 0.09, 0.7, 1);

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" style={{position: "absolute"}}>
        <line
          x1={NODES[0].x}
          y1={NODES[0].y + NODES[0].h / 2}
          x2={NODES[1].x}
          y2={NODES[1].y - NODES[1].h / 2}
          stroke={COLORS.border}
          strokeWidth={2}
        />
        <line
          x1={NODES[1].x}
          y1={NODES[1].y + NODES[1].h / 2}
          x2={NODES[2].x}
          y2={NODES[2].y - NODES[2].h / 2}
          stroke={COLORS.border}
          strokeWidth={2}
        />
      </svg>

      {NODES.map((n, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: n.x - n.w / 2,
            top: n.y - n.h / 2,
            width: n.w,
            height: n.h,
            borderRadius: 14,
            border: `2px solid ${COLORS.muted}`,
            opacity: (0.55 + i * 0.15) * glow * fadeSlideUp(frame, i * 6, 16).opacity,
            transform: fadeSlideUp(frame, i * 6, 16).transform,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: NODES[0].x + 90,
          top: NODES[0].y - 70,
          color: COLORS.cyan,
          fontSize: 54,
          fontWeight: 800,
          opacity: 0.75 + Math.sin(frame * 0.12) * 0.2,
          textShadow: `0 0 16px ${COLORS.glowCyan}`,
        }}
      >
        ?
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
