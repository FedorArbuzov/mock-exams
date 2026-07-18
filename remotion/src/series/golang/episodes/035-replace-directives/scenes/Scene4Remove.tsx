import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {TriangleAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Remove: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const topIn = progress01(frame, 0, 20);
  const leftIn = progress01(frame, 34, 54);
  const rightIn = progress01(frame, 44, 64);
  const shipIn = progress01(frame, 82, 100);

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
              top: 120,
              transform: `translate(-50%, -50%) translateY(${(1 - topIn) * 10}px)`,
              opacity: topIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <TriangleAlert size={70} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
              replace still in go.mod
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 260,
              top: 400,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 21, fontWeight: 700, textAlign: "center"}}>
              remove it
              <br />
              before release
            </div>
            <Checkmark progress={leftIn} size={44} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 400,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 21, fontWeight: 700, textAlign: "center"}}>
              or CI checks
              <br />
              the real version
            </div>
            <Checkmark progress={rightIn} size={44} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 620,
              transform: "translate(-50%, -50%)",
              opacity: shipIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={shipIn} size={54} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              safe to ship
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
