import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FolderLock, MessageCircleQuestion} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3StrongerThanConvention: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 16, 36);

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
              left: 40,
              top: 60,
              width: 380,
              opacity: leftIn,
              transform: `translateY(${(1 - leftIn) * 14}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              padding: "30px 0",
              borderRadius: 18,
              border: `2px dashed ${COLORS.muted}`,
            }}
          >
            <MessageCircleQuestion size={70} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
              lowercase names
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
              just a convention
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 460,
              top: 60,
              width: 380,
              opacity: rightIn,
              transform: `translateY(${(1 - rightIn) * 14}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              padding: "30px 0",
              borderRadius: 18,
              border: `2px solid ${COLORS.cyan}`,
              background: "rgba(34,211,238,0.06)",
              boxShadow: `0 0 26px ${COLORS.glowCyan}`,
            }}
          >
            <FolderLock size={70} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
              internal
            </div>
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
              enforced by the compiler
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
