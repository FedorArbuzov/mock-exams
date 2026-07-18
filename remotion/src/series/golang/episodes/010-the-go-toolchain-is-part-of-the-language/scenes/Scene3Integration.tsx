import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {LockIcon, ToolboxIcon, XMarkGlyph} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ICON_W = 620;
const ICON_H = Math.round((ICON_W * 70) / 90);

const SCATTERED = [
  {x: 150, y: 480},
  {x: 930, y: 480},
  {x: 150, y: 1080},
];

export const Scene3Integration: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const boxIn = progress01(frame, 0, 18);
  const lockIn = progress01(frame, durationInFrames * 0.4, durationInFrames * 0.56);
  const scatterOut = progress01(frame, durationInFrames * 0.55, durationInFrames * 0.78);

  return (
    <AbsoluteFill>
      {SCATTERED.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            transform: "translate(-50%, -50%)",
            width: 74,
            height: 74,
            borderRadius: 14,
            border: `2px solid ${COLORS.muted}`,
            opacity: Math.max(0.15, 1 - scatterOut),
          }}
        >
          <div style={{position: "absolute", left: 0, top: 0, opacity: scatterOut}}>
            <XMarkGlyph size={74} />
          </div>
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: `translate(-50%, -50%) scale(${0.9 + boxIn * 0.1})`,
          opacity: boxIn,
        }}
      >
        <div style={{position: "relative", width: ICON_W, height: ICON_H}}>
          <ToolboxIcon size={ICON_W} />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "73%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              opacity: lockIn,
            }}
          >
            <LockIcon size={54} color={COLORS.cyan} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
              gofmt
            </div>
          </div>
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
