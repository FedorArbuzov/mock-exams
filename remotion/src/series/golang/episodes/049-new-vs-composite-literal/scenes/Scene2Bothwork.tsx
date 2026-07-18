import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Bothwork: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const rightIn = progress01(frame, 22, 44);
  const mergeIn = progress01(frame, 52, 74);
  const checkIn = progress01(frame, 78, 98);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "14px 22px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 750,
              }}
            >
              new(T)
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              zeroed
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 740,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "14px 22px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 750,
              }}
            >
              &T{"{}"}
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              literal
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 480,
              top: 220,
              opacity: (leftIn + rightIn) / 2,
            }}
          >
            <Arrow direction="right" size={44} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 400,
              transform: `translate(-50%, -50%) translateY(${(1 - mergeIn) * 12}px)`,
              opacity: mergeIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "16px 28px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 50,
                fontWeight: 800,
                textShadow: `0 0 12px ${COLORS.glowCyan}`,
              }}
            >
              *T
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12, opacity: checkIn}}>
              <Checkmark progress={checkIn} size={40} />
              <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
                both work
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
