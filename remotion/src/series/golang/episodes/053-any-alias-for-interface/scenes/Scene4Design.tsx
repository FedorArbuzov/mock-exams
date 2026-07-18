import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Link2, ShieldOff} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Design: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const bridgeIn = progress01(frame, 0, 24);
  const warnIn = progress01(frame, 28, 48);
  const labelIn = progress01(frame, 52, 72);

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
              transform: `translate(-50%, -50%) translateY(${(1 - bridgeIn) * 12}px)`,
              opacity: bridgeIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Link2 size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              bridge
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700}}>
              JSON decode
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
              opacity: (bridgeIn + warnIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - warnIn) * 12}px)`,
              opacity: warnIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <ShieldOff size={64} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750, opacity: labelIn}}>
              not skip design
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
