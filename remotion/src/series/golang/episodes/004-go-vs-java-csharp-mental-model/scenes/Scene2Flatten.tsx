import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const START = [
  {x: 540, y: 640},
  {x: 420, y: 800},
  {x: 620, y: 960},
];

const END = [
  {x: 300, y: 820},
  {x: 540, y: 820},
  {x: 780, y: 820},
];

const LABELS = ["struct", "method", "interface"];

export const Scene2Flatten: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const flatten = progress01(frame, 6, durationInFrames * 0.4);
  const colorShift = progress01(frame, durationInFrames * 0.3, durationInFrames * 0.55);

  return (
    <AbsoluteFill>
      {START.map((s, i) => {
        const e = END[i];
        const x = interpolate(flatten, [0, 1], [s.x, e.x], clamp);
        const y = interpolate(flatten, [0, 1], [s.y, e.y], clamp);
        const color = colorShift > 0.5 ? COLORS.cyan : COLORS.muted;
        const labelIn = progress01(frame, durationInFrames * 0.45 + i * 8, durationInFrames * 0.45 + i * 8 + 14);

        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x - 75,
                top: y - 35,
                width: 150,
                height: 70,
                borderRadius: 14,
                border: `2px solid ${color}`,
                boxShadow: colorShift > 0.5 ? `0 0 20px ${COLORS.glowCyan}` : "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x - 75,
                top: y + 45,
                width: 150,
                textAlign: "center",
                color: COLORS.white,
                fontFamily: FONTS.sans,
                fontSize: 24,
                fontWeight: 650,
                opacity: labelIn,
                transform: `translateY(${(1 - labelIn) * 10}px)`,
              }}
            >
              {LABELS[i]}
            </div>
          </React.Fragment>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
