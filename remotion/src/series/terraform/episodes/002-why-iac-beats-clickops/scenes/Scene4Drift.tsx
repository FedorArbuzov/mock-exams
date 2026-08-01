import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, Swords} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Drift: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 24);
  const clashIn = progress01(frame, 28, 52);
  const rightIn = progress01(frame, 56, 80);

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
              left: 260,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "18px 28px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.red}66`,
                color: COLORS.red,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 800,
              }}
            >
              Console
            </div>
            <div
              style={{
                color: COLORS.red,
                fontFamily: FONTS.sans,
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              source of truth
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 300,
              transform: "translate(-50%, -50%)",
              opacity: clashIn,
            }}
          >
            <Swords size={56} color={COLORS.red} strokeWidth={1.6} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "18px 28px",
                borderRadius: 12,
                border: `2px solid ${COLORS.cyan}`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 800,
              }}
            >
              terraform plan
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              <AlertTriangle size={40} color={COLORS.red} strokeWidth={1.6} />
              <div
                style={{
                  color: COLORS.red,
                  fontFamily: FONTS.sans,
                  fontSize: 38,
                  fontWeight: 750,
                }}
              >
                drift fights you
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
