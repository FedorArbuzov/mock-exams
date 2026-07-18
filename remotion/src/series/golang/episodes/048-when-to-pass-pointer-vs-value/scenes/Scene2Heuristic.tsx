import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Box, Package} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Heuristic: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const rightIn = progress01(frame, 28, 52);
  const labelIn = progress01(frame, 72, 94);

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
            <Box size={72} color={COLORS.green} strokeWidth={1.6} />
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
              int, bool
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
              small value
            </div>
            <Checkmark progress={leftIn} size={40} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 280,
              width: 1,
              height: 240,
              background: COLORS.border,
              opacity: (leftIn + rightIn) / 2,
            }}
          />

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
              gap: 16,
            }}
          >
            <Package size={72} color={COLORS.cyan} strokeWidth={1.6} />
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
              *BigStruct
            </div>
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
              large / mutate
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 750,
            }}
          >
            values default
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
