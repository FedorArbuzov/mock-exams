import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Flask, NetworkNodes, XMarkGlyph} from "../../../../../shared/components/icons";
import {GoLogo} from "../../../icons/GoLogo";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TangledLines: React.FC = () => (
  <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
    <path d="M6 10c10 4 4 14 16 12S28 6 40 14" stroke={COLORS.muted} strokeWidth="2" opacity="0.6" />
    <path d="M8 32c8-8 6 10 18 2s6-14 16-6" stroke={COLORS.muted} strokeWidth="2" opacity="0.5" />
  </svg>
);

export const Scene4Mental: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const markIn = progress01(frame, durationInFrames * 0.28, durationInFrames * 0.42);
  const tagsIn = progress01(frame, durationInFrames * 0.5, durationInFrames * 0.66);

  const TAGS = ["clear names", "errors", "structs"];

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 640,
          width: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          ...fadeSlideUp(frame, 0, 18),
        }}
      >
        <Flask size={80} />
        <TangledLines />
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 650}}>
          research
        </div>
        <div style={{opacity: markIn, marginTop: 6}}>
          <XMarkGlyph size={48} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 640,
          width: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          ...fadeSlideUp(frame, 6, 18),
        }}
      >
        <GoLogo size={80} />
        <NetworkNodes size={70} />
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700}}>
          production
        </div>
        <div style={{opacity: markIn, marginTop: 6}}>
          <Checkmark progress={markIn} size={48} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 600,
          bottom: 780,
          width: 1,
          background: `linear-gradient(180deg, transparent, ${COLORS.border}, transparent)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1300,
          transform: "translateX(-50%)",
          display: "flex",
          gap: 16,
          opacity: tagsIn,
        }}
      >
        {TAGS.map((tag) => (
          <div
            key={tag}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: `1.5px solid ${COLORS.cyan}`,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 20,
              fontWeight: 650,
            }}
          >
            {tag}
          </div>
        ))}
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
