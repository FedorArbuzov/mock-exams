import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Package, TriangleAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const SCATTER = [
  {dx: -110, dy: -50, rot: -10},
  {dx: 100, dy: -60, rot: 14},
  {dx: -60, dy: 60, rot: 8},
  {dx: 130, dy: 50, rot: -16},
  {dx: 10, dy: -10, rot: 4},
];

export const Scene3Bump: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 16, 36);
  const warnIn = progress01(frame, 50, 68);

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
        <Panel width={900} height={700}>
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 210,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 14}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{position: "relative"}}>
              <Package size={90} color={COLORS.green} strokeWidth={1.6} />
              <div style={{position: "absolute", right: -20, top: -18}}>
                <Arrow direction="up" size={30} color={COLORS.green} />
              </div>
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
              go get
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650, textAlign: "center", maxWidth: 220}}>
              one dependency, chosen version
            </div>
            <Checkmark progress={leftIn} size={44} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 660,
              top: 210,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
            }}
          >
            {SCATTER.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: s.dx,
                  top: s.dy,
                  transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
                }}
              >
                <Package size={46} color={COLORS.muted} strokeWidth={1.6} />
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: 660,
              top: 340,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 18,
              fontWeight: 650,
              textAlign: "center",
              maxWidth: 260,
            }}
          >
            update everything blindly
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: "translate(-50%, -50%)",
              opacity: warnIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <TriangleAlert size={44} color={COLORS.red} strokeWidth={1.8} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              Friday afternoon build breaks
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
