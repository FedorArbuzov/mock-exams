import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Eye, Key} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const ownIn = progress01(frame, 0, 32);
  const observeIn = progress01(frame, 34, 66);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={920} height={620} accent={COLORS.green}>
          <div
            style={{
              position: "absolute",
              left: 280,
              top: 310,
              transform: `translate(-50%, -50%) rotate(-6deg) scale(${0.85 + ownIn * 0.15})`,
              opacity: ownIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "20px 36px",
              borderRadius: 10,
              border: `3px solid ${COLORS.green}`,
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            <Key size={48} color={COLORS.green} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.green,
                fontFamily: FONTS.sans,
                fontSize: 44,
                fontWeight: 850,
                letterSpacing: 2,
                textTransform: "uppercase",
                textShadow: `0 0 20px ${COLORS.glowGreen}`,
              }}
            >
              OWN
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 640,
              top: 310,
              transform: `translate(-50%, -50%) rotate(6deg) scale(${0.85 + observeIn * 0.15})`,
              opacity: observeIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "20px 36px",
              borderRadius: 10,
              border: `3px solid ${COLORS.cyan}`,
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            <Eye size={48} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.sans,
                fontSize: 44,
                fontWeight: 850,
                letterSpacing: 2,
                textTransform: "uppercase",
                textShadow: `0 0 20px ${COLORS.glowCyan}`,
              }}
            >
              OBSERVE
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
