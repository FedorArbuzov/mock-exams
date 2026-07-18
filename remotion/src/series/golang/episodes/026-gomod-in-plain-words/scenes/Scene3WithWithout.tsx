import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileX2, GitFork} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3WithWithout: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const rightIn = progress01(frame, 14, 32);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={880} height={640}>
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 180,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 14}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <FileX2 size={90} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700, textAlign: "center"}}>
              no go.mod
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 650, textAlign: "center", maxWidth: 260}}>
              outside the module system
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 660,
              top: 180,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 14}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <GitFork size={90} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700, textAlign: "center"}}>
              go.mod present
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 650, textAlign: "center", maxWidth: 260}}>
              clone and build, anywhere
            </div>
            <Checkmark progress={rightIn} size={54} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
