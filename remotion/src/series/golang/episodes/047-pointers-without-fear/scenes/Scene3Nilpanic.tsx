import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, ShieldCheck} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Nilpanic: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const panicIn = progress01(frame, 24, 44);
  const rightIn = progress01(frame, 48, 72);
  const checkIn = progress01(frame, 76, 96);

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
              left: 240,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.red}66`,
                color: COLORS.red,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 700,
              }}
            >
              var p *int
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12, opacity: panicIn}}>
              <AlertTriangle size={48} color={COLORS.red} strokeWidth={1.6} />
              <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
                *p panics
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              width: 1,
              height: 260,
              background: COLORS.border,
              opacity: (leftIn + rightIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              if p != nil {"{"}
              <br />
              {"  "}
              *p = 1
              <br />
              {"}"}
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 14, opacity: checkIn}}>
              <ShieldCheck size={44} color={COLORS.green} strokeWidth={1.6} />
              <Checkmark progress={checkIn} size={40} />
              <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
                nil check
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
