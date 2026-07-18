import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {XMarkGlyph} from "../../../../../shared/components/icons";
import {LangBadge} from "../../../icons/LangBadge";
import {fadeSlideUpWith, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ALTERNATIVES = ["random Homebrew fork", "random nightly build"];

export const Scene2Source: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const checkIn = progress01(frame, 16, 34);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 620,
          ...fadeSlideUpWith("translate(-50%, -50%)", frame, 0, 18),
        }}
      >
        <LangBadge label="go.dev" accent={COLORS.cyan} emphasis />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 750,
          transform: "translate(-50%, -50%)",
          opacity: checkIn,
        }}
      >
        <Checkmark progress={checkIn} size={78} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 830,
          transform: "translateX(-50%)",
          color: COLORS.muted,
          fontFamily: FONTS.sans,
          fontSize: 22,
          fontWeight: 650,
          opacity: checkIn,
        }}
      >
        official toolchain
      </div>

      {ALTERNATIVES.map((label, i) => {
        const delay = 40 + i * 20;
        const rowIn = progress01(frame, delay, delay + 14);
        const xIn = progress01(frame, delay + 8, delay + 22);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: "50%",
              top: 1080 + i * 130,
              transform: `translate(-50%, -50%) translateY(${(1 - rowIn) * 14}px)`,
              opacity: rowIn,
              display: "flex",
              alignItems: "center",
              gap: 26,
              width: 620,
              justifyContent: "space-between",
            }}
          >
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 600}}>
              {label}
            </div>
            <div style={{opacity: xIn}}>
              <XMarkGlyph size={76} />
            </div>
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
