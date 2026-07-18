import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Naked: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const warnIn = progress01(frame, 24, 44);
  const arrowIn = progress01(frame, 46, 62);
  const rightIn = progress01(frame, 64, 84);

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
              top: 280,
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
                padding: "18px 26px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.red}66`,
                color: COLORS.red,
                fontFamily: FONTS.mono,
                fontSize: 46,
                fontWeight: 800,
              }}
            >
              return
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12, opacity: warnIn}}>
              <AlertTriangle size={44} color={COLORS.red} strokeWidth={1.6} />
              <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
                naked return
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 280,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
            }}
          >
            <Arrow direction="right" size={50} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 280,
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
                padding: "16px 22px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              return n, err
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
              explicit
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
