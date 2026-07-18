import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4FormatOnSave: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const toggleOn = progress01(frame, 14, 34);
  const checkIn = progress01(frame, 30, 48);
  const knobX = 8 + toggleOn * 84;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 720,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700}}>
          Format on Save
        </div>

        <div
          style={{
            position: "relative",
            width: 160,
            height: 76,
            borderRadius: 999,
            background: `rgba(52, 211, 153, ${0.12 + toggleOn * 0.18})`,
            border: `2px solid ${COLORS.green}`,
            boxShadow: toggleOn > 0.5 ? `0 0 24px ${COLORS.glowGreen}` : "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: knobX,
              top: 8,
              width: 60,
              height: 60,
              borderRadius: 999,
              background: COLORS.green,
            }}
          />
        </div>

        <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
          gofmt
        </div>

        <Checkmark progress={checkIn} size={78} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
