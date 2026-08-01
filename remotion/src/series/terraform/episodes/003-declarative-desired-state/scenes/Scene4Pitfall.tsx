import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, FileText, RefreshCw} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Pitfall: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const installerIn = progress01(frame, 0, 22);
  const renameIn = progress01(frame, 24, 48);
  const planIn = progress01(frame, 52, 76);
  const labelIn = progress01(frame, 78, 98);

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
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - installerIn) * 12}px)`,
              opacity: installerIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <RefreshCw size={52} color={COLORS.red} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.red,
                fontFamily: FONTS.sans,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              one-shot installer
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              transform: "translate(-50%, -50%)",
              opacity: renameIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <AlertTriangle size={48} color={COLORS.red} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.red,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 800,
                textAlign: "center",
                width: 280,
              }}
            >
              rename → destroy + recreate
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - planIn) * 12}px)`,
              opacity: planIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <FileText size={52} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                padding: "16px 28px",
                borderRadius: 12,
                border: `2px solid ${COLORS.cyan}`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 44,
                fontWeight: 800,
                boxShadow: `0 0 20px ${COLORS.glowCyan}`,
              }}
            >
              plan
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.green,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 720,
            }}
          >
            the plan is the contract
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
