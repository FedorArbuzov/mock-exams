import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {MagnifyingGlass, XMarkGlyph} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TAGS = ["struct", "error return", "small interface"];

export const Scene4Shift: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const glassIn = progress01(frame, 4, 20);
  const xIn = progress01(frame, 26, 40);
  const tagsIn = progress01(frame, durationInFrames * 0.45, durationInFrames * 0.6);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 620,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
          width: 220,
          height: 150,
          borderRadius: 16,
          border: `2px dashed ${COLORS.muted}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 650}}>
          class
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 500,
          transform: `translate(-50%, -50%) scale(${0.7 + glassIn * 0.3})`,
          opacity: glassIn * (1 - xIn * 0.4),
        }}
      >
        <MagnifyingGlass size={64} color={COLORS.muted} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 620,
          transform: "translate(-50%, -50%)",
          opacity: xIn,
        }}
      >
        <XMarkGlyph size={170} color={COLORS.red} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1080,
          transform: "translateX(-50%)",
          display: "flex",
          gap: 20,
          opacity: tagsIn,
        }}
      >
        {TAGS.map((tag) => (
          <div
            key={tag}
            style={{
              padding: "12px 20px",
              borderRadius: 999,
              border: `1.5px solid ${COLORS.cyan}`,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 22,
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
