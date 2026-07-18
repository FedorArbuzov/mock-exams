import React, {useMemo} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {fadeSlideUp} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CHAOTIC = [
  {x: 220, y: 560, kind: "triangle", color: "#F87171"},
  {x: 850, y: 640, kind: "star", color: "#F59E0B"},
  {x: 260, y: 1080, kind: "spiral", color: "#8B5CF6"},
  {x: 820, y: 1040, kind: "triangle", color: "#34D399"},
];

const Shape: React.FC<{kind: string; color: string; rotation: number}> = ({kind, color, rotation}) => {
  if (kind === "triangle") {
    return (
      <svg width="52" height="52" viewBox="0 0 48 48" style={{transform: `rotate(${rotation}deg)`}}>
        <path d="M24 6l18 36H6z" stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "star") {
    return (
      <svg width="52" height="52" viewBox="0 0 48 48" style={{transform: `rotate(${rotation}deg)`}}>
        <path
          d="M24 4l5 14h15l-12 9 5 15-13-9-13 9 5-15-12-9h15z"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="52" height="52" viewBox="0 0 48 48" style={{transform: `rotate(${rotation}deg)`}}>
      <path
        d="M24 24c0-6 8-6 8 0s-10 10-10 0 12-14 12-4-14 18-14 4"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const shapes = useMemo(() => CHAOTIC, []);
  const stillGlow = 0.6 + Math.sin(frame * 0.05) * 0.15;

  return (
    <AbsoluteFill>
      {shapes.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y + Math.sin(frame * 0.1 + i) * 18,
            opacity: 0.8 * fadeSlideUp(frame, i * 4, 16).opacity,
            transform: fadeSlideUp(frame, i * 4, 16).transform,
          }}
        >
          <Shape kind={s.kind} color={s.color} rotation={frame * (2 + i)} />
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 830,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 10, 20).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 10, 20).opacity,
          width: 110,
          height: 110,
          borderRadius: 22,
          background: COLORS.card,
          border: `2px solid ${COLORS.cyan}`,
          boxShadow: `0 0 ${20 * stillGlow}px ${COLORS.glowCyan}`,
        }}
      />

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
