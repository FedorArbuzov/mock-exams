import React, {useMemo} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {XMarkGlyph} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4CleanRepo: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const xIn = progress01(frame, 30, 46);
  const checkIn = progress01(frame, durationInFrames * 0.5, durationInFrames * 0.66);
  const stack = useMemo(() => [0, 1, 2, 3, 4, 5], []);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 700,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{position: "relative", width: 130, height: 130}}>
          {stack.map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 20 - i * 3,
                top: 20 - i * 3 + i * 14,
                width: 90,
                height: 18,
                borderRadius: 6,
                border: `1.5px solid ${COLORS.muted}`,
                ...fadeSlideUp(frame, i * 4, 12),
              }}
            />
          ))}
          <div style={{position: "absolute", left: 30, top: 40, opacity: xIn}}>
            <XMarkGlyph size={80} />
          </div>
        </div>
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 620, textAlign: "center"}}>
          every stdlib package
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 700,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: 18,
            border: `2px solid ${COLORS.cyan}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 22px ${COLORS.glowCyan}`,
          }}
        >
          <Checkmark progress={checkIn} size={70} />
        </div>
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 680, textAlign: "center"}}>
          builds, tests, formats
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
