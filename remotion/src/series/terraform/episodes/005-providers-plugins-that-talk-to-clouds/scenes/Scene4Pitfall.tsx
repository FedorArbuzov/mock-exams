import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, GitBranch} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Pitfall: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 24);
  const warnIn = progress01(frame, 28, 52);
  const rightIn = progress01(frame, 56, 80);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720} accent={COLORS.red}>
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <GitBranch size={56} color={COLORS.red} strokeWidth={1.6} />
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `1.5px dashed ${COLORS.red}88`,
                color: COLORS.red,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              no required_providers
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 280,
              transform: "translate(-50%, -50%)",
              opacity: warnIn,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertTriangle size={52} color={COLORS.red} strokeWidth={1.6} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 40, fontWeight: 750}}>
              v5.0 vs v6.2
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 720}}>
              different plugin
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
              color: COLORS.green,
              fontFamily: FONTS.sans,
              fontSize: 40,
              fontWeight: 780,
              textShadow: `0 0 16px ${COLORS.glowGreen}`,
            }}
          >
            lock what works
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
