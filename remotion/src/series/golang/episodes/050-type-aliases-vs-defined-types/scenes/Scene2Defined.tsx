import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Ban, ShieldCheck} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Defined: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const blockIn = progress01(frame, 28, 50);
  const rightIn = progress01(frame, 54, 76);
  const labelIn = progress01(frame, 80, 98);

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
              top: 260,
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
                border: `1.5px solid ${COLORS.muted}`,
                color: COLORS.muted,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 750,
              }}
            >
              int
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 480,
              top: 260,
              transform: "translate(-50%, -50%)",
              opacity: blockIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ban size={56} color={COLORS.red} strokeWidth={1.8} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
              cannot mix
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 740,
              top: 260,
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
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              type UserID int
            </div>
            <ShieldCheck size={48} color={COLORS.green} strokeWidth={1.6} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 750,
            }}
          >
            distinct types
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
