import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Lock, Terminal} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Init: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const termIn = progress01(frame, 0, 24);
  const lockIn = progress01(frame, 28, 52);
  const pinIn = progress01(frame, 56, 80);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={920} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - termIn) * 14}px)`,
              opacity: termIn,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "24px 32px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(15, 23, 42, 0.65)",
              width: 780,
            }}
          >
            <Terminal size={48} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 44, fontWeight: 780}}>
              $ terraform init
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 420,
              transform: `translate(-50%, -50%) translateY(${(1 - lockIn) * 14}px)`,
              opacity: lockIn,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "22px 32px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.green}88`,
              background: "rgba(15, 23, 42, 0.55)",
              width: 780,
            }}
          >
            <Lock size={48} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 42, fontWeight: 750}}>
              .terraform.lock.hcl
            </div>
            <Checkmark progress={lockIn} size={40} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 580,
              transform: "translate(-50%, -50%)",
              opacity: pinIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 720,
              textAlign: "center",
              width: 760,
            }}
          >
            pin versions — no surprise bumps
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
