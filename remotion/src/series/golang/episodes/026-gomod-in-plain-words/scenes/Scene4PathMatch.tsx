import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {GitBranch, Tag} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4PathMatch: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const topIn = progress01(frame, 0, 18);
  const bottomIn = progress01(frame, 16, 34);
  const checkIn = progress01(frame, 44, 62);

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
        <Panel width={840} height={620}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 110,
              transform: `translate(-50%, -50%) translateY(${(1 - topIn) * 14}px)`,
              opacity: topIn,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "18px 30px",
              borderRadius: 16,
              border: `2px solid ${COLORS.cyan}`,
              background: "rgba(34,211,238,0.06)",
            }}
          >
            <Tag size={44} color={COLORS.cyan} strokeWidth={1.7} />
            <div>
              <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
                module path
              </div>
              <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
                github.com/you/app
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 300,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
            }}
          >
            <Checkmark progress={checkIn} size={56} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 490,
              transform: `translate(-50%, -50%) translateY(${(1 - bottomIn) * 14}px)`,
              opacity: bottomIn,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "18px 30px",
              borderRadius: 16,
              border: `2px solid ${COLORS.green}`,
              background: "rgba(52,211,153,0.06)",
            }}
          >
            <GitBranch size={44} color={COLORS.green} strokeWidth={1.7} />
            <div>
              <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
                repo location
              </div>
              <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
                github.com/you/app
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
