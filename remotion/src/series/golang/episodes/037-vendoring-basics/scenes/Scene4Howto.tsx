import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Archive} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Howto: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const topIn = progress01(frame, 0, 20);
  const leftIn = progress01(frame, 34, 54);
  const rightIn = progress01(frame, 44, 64);

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
        <Panel width={940} height={780}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 110,
              transform: `translate(-50%, -50%) translateY(${(1 - topIn) * 10}px)`,
              opacity: topIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Archive size={60} color={COLORS.white} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              vendoring?
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 260,
              top: 420,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>yes</div>
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700, textAlign: "center"}}>
              commit vendor/
              <br />
              build -mod=vendor
            </div>
            <Checkmark progress={leftIn} size={44} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 420,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>no</div>
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700, textAlign: "center"}}>
              keep go.sum
              <br />
              strict in CI
            </div>
            <Checkmark progress={rightIn} size={44} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
