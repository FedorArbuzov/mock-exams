import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {XMarkGlyph} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const WarningGlyph: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M24 6l18 32H6z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M24 20v9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="24" cy="34" r="1.8" fill={color} />
  </svg>
);

export const Scene4InterviewTrap: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const trapIn = progress01(frame, 0, 18);
  const xIn = progress01(frame, 24, 40);
  const checkIn = progress01(frame, durationInFrames * 0.5, durationInFrames * 0.66);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 640,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
        }}
      >
        <WarningGlyph size={140} color={COLORS.red} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 300,
          top: 920,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 650}}>
          "no generics"
        </div>
        <div style={{opacity: xIn}}>
          <XMarkGlyph size={76} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 920,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 650}}>
          better answer
        </div>
        <Checkmark progress={checkIn} size={76} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
