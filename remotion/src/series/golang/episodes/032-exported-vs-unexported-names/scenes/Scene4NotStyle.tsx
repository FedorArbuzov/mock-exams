import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Globe, Lock} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4NotStyle: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const beforeIn = progress01(frame, 0, 20);
  const arrowIn = progress01(frame, 30, 48);
  const afterIn = progress01(frame, 46, 66);
  const labelIn = progress01(frame, 76, 96);

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
              top: 210,
              transform: `translate(-50%, -50%) translateY(${(1 - beforeIn) * 12}px)`,
              opacity: beforeIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Lock size={78} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
              parseConfig
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 210,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Arrow direction="right" size={54} color={COLORS.cyan} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 700}}>
              rename
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 740,
              top: 210,
              transform: `translate(-50%, -50%) translateY(${(1 - afterIn) * 12}px)`,
              opacity: afterIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Globe size={78} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
              ParseConfig
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 460,
              transform: `translate(-50%, -50%) translateY(${(1 - labelIn) * 10}px)`,
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            now part of your public API surface
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
