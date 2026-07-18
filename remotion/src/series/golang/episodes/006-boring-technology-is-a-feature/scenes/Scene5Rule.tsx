import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {XMarkGlyph} from "../../../../../shared/components/icons";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const splitIn = progress01(frame, 4, 26);
  const cleverX = progress01(frame, 30, 50);
  const plainX = progress01(frame, 36, 56);
  const spin = interpolate(frame, [0, durationInFrames], [0, 360], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 620,
          transform: "translate(-50%, -50%)",
          width: 16,
          height: 16,
          borderRadius: 99,
          background: COLORS.cyan,
          opacity: splitIn,
        }}
      />

      <svg width="100%" height="100%" style={{position: "absolute"}}>
        <line
          x1={540}
          y1={620}
          x2={interpolate(splitIn, [0, 1], [540, 300], clamp)}
          y2={interpolate(splitIn, [0, 1], [620, 900], clamp)}
          stroke={COLORS.muted}
          strokeWidth={2}
        />
        <line
          x1={540}
          y1={620}
          x2={interpolate(splitIn, [0, 1], [540, 780], clamp)}
          y2={interpolate(splitIn, [0, 1], [620, 900], clamp)}
          stroke={COLORS.cyan}
          strokeWidth={2}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 300,
          top: 950,
          transform: `translate(-50%, -50%) rotate(${spin}deg)`,
          opacity: splitIn,
        }}
      >
        <svg width="64" height="64" viewBox="0 0 48 48">
          <path
            d="M24 4l5 14h15l-12 9 5 15-13-9-13 9 5-15-12-9h15z"
            stroke={COLORS.muted}
            strokeWidth="2.5"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 1030,
          transform: "translate(-50%, -50%)",
          color: COLORS.muted,
          fontFamily: FONTS.sans,
          fontSize: 20,
          fontWeight: 620,
        }}
      >
        clever abstraction
      </div>
      <div style={{position: "absolute", left: 300, top: 1070, transform: "translate(-50%, -50%)", opacity: cleverX}}>
        <XMarkGlyph size={36} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 940,
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 12,
          opacity: splitIn,
        }}
      >
        <div style={{width: 44, height: 44, borderRadius: 10, border: `2px solid ${COLORS.cyan}`}} />
        <div style={{width: 44, height: 44, borderRadius: 10, border: `2px solid ${COLORS.cyan}`}} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 780,
          top: 1010,
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 20,
          color: COLORS.white,
          fontFamily: FONTS.sans,
          fontSize: 20,
          fontWeight: 620,
        }}
      >
        <div>function</div>
        <div>struct</div>
      </div>
      <div style={{position: "absolute", left: 780, top: 1060, transform: "translate(-50%, -50%)", opacity: plainX}}>
        <Checkmark progress={plainX} size={40} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
