import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Binary} from "../../../icons/Binary";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TAGS = [
  {text: "python version mismatch", dx: -260, dy: -40},
  {text: "JVM tuning per host", dx: 260, dy: 60},
];

export const Scene3Deploys: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const drift = progress01(frame, 20, durationInFrames * 0.6);
  const labelIn = progress01(frame, durationInFrames * 0.65, durationInFrames * 0.8);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
        }}
      >
        <Binary label="app" size={140} />
      </div>

      {TAGS.map((tag, i) => {
        const x = interpolate(drift, [0, 1], [0, tag.dx], clamp);
        const y = interpolate(drift, [0, 1], [0, tag.dy], clamp);
        const opacity = interpolate(drift, [0, 0.3, 1], [0, 1, 0.35], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: 780,
              transform: `translate(calc(-50% + ${x}px), ${y}px)`,
              opacity,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 620,
              textDecoration: drift > 0.5 ? "line-through" : "none",
              textDecorationColor: COLORS.red,
              whiteSpace: "nowrap",
            }}
          >
            {tag.text}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1020,
          transform: "translateX(-50%)",
          opacity: labelIn,
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 28,
          fontWeight: 720,
          textShadow: `0 0 14px ${COLORS.glowCyan}`,
        }}
      >
        OS runs it
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
