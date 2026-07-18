import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Bug, Folder, Tag} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4MixingBugs: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const rightIn = progress01(frame, 14, 32);
  const bugIn = progress01(frame, 40, 58);

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
              gap: 16,
            }}
          >
            <Tag size={84} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
              module
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600, textAlign: "center", maxWidth: 220}}>
              no code lives directly here
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
              gap: 16,
            }}
          >
            <Folder size={84} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
              package
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600, textAlign: "center", maxWidth: 220}}>
              code goes here
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 440,
              transform: "translate(-50%, -50%)",
              opacity: bugIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Bug size={44} color={COLORS.red} strokeWidth={1.8} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              mixing the two = real bugs
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 660,
              top: 300,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
            }}
          >
            <Checkmark progress={rightIn} size={44} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
