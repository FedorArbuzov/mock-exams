import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {GenericBracketIcon} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 4, 20);
  const rightIn = progress01(frame, 30, 46);
  const leftCheck = progress01(frame, 24, 40);
  const rightCheck = progress01(frame, 50, 66);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 760,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 4, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 4, 16).opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 620, textAlign: "center", maxWidth: 260}}>
          copy-paste hurts?
        </div>
        <GenericBracketIcon size={90} />
        <Checkmark progress={leftCheck} size={76} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 760,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: rightIn,
        }}
      >
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 620, textAlign: "center", maxWidth: 260}}>
          plain function works?
        </div>
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 16,
            border: `2px solid ${COLORS.cyan}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.cyan,
            fontFamily: FONTS.mono,
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          fn
        </div>
        <Checkmark progress={rightCheck} size={76} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
