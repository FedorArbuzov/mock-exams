import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Ban, FileCode} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const SCATTER = [
  {dx: -130, dy: -50, rot: -14},
  {dx: 110, dy: -70, rot: 18},
  {dx: -70, dy: 60, rot: 10},
  {dx: 140, dy: 50, rot: -20},
  {dx: 10, dy: -10, rot: 6},
  {dx: -20, dy: 100, rot: -8},
];

export const Scene4Avoid: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const clusterIn = progress01(frame, 0, 24);
  const banIn = progress01(frame, 30, 50);

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
        <Panel width={880} height={620}>
          <div style={{position: "absolute", left: "50%", top: 220, transform: "translate(-50%, -50%)"}}>
            {SCATTER.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: s.dx,
                  top: s.dy,
                  transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
                  opacity: clusterIn * 0.75,
                }}
              >
                <FileCode size={50} color={COLORS.muted} strokeWidth={1.6} />
              </div>
            ))}
            <div style={{opacity: banIn}}>
              <Ban size={120} color={COLORS.red} strokeWidth={1.4} />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 400,
              transform: "translate(-50%, -50%)",
              opacity: banIn,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            everything in package main
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 480,
              transform: "translate(-50%, -50%)",
              opacity: banIn,
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            untestable soup
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
