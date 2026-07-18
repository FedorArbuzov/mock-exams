import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {GenericBracketIcon, XMarkGlyph} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Unlocked: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const versionIn = progress01(frame, 0, 16);
  const unlockIn = progress01(frame, 14, 30);
  const goodIn = progress01(frame, durationInFrames * 0.4, durationInFrames * 0.56);
  const badIn = progress01(frame, durationInFrames * 0.46, durationInFrames * 0.62);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          padding: "10px 22px",
          borderRadius: 999,
          border: `2px solid ${COLORS.cyan}`,
          color: COLORS.cyan,
          fontFamily: FONTS.mono,
          fontSize: 24,
          fontWeight: 700,
          opacity: versionIn,
        }}
      >
        go1.18
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 720,
          transform: "translate(-50%, -50%)",
          opacity: unlockIn,
        }}
      >
        <GenericBracketIcon size={150} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 300,
          top: 960,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          opacity: goodIn,
        }}
      >
        <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
          Min func
        </div>
        <Checkmark progress={goodIn} size={76} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 960,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          opacity: badIn,
        }}
      >
        <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
          type framework
        </div>
        <XMarkGlyph size={76} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
