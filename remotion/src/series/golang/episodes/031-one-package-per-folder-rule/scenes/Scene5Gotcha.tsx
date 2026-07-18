import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Ban, FileCode, FolderTree} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const SCATTER = [
  {dx: -120, dy: -40, rot: -12, color: "cyan"},
  {dx: 100, dy: -60, rot: 16, color: "red"},
  {dx: -60, dy: 50, rot: 8, color: "cyan"},
  {dx: 130, dy: 40, rot: -18, color: "red"},
  {dx: 10, dy: -10, rot: 6, color: "cyan"},
];

export const Scene5Gotcha: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const clusterIn = progress01(frame, 0, 24);
  const banIn = progress01(frame, 30, 50);
  const labelIn = progress01(frame, 56, 74);
  const fixIn = progress01(frame, 90, 110);

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
        <Panel width={880} height={780}>
          <div style={{position: "absolute", left: "50%", top: 210, transform: "translate(-50%, -50%)"}}>
            {SCATTER.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: s.dx,
                  top: s.dy,
                  transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
                  opacity: clusterIn * 0.8,
                }}
              >
                <FileCode
                  size={48}
                  color={s.color === "cyan" ? COLORS.cyan : COLORS.red}
                  strokeWidth={1.6}
                />
              </div>
            ))}
            <div style={{opacity: banIn}}>
              <Ban size={110} color={COLORS.red} strokeWidth={1.4} />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 390,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 750,
              textAlign: "center",
            }}
          >
            different package clauses,
            <br />
            same folder
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 540,
              width: 880,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 650,
              transform: `translate(-50%, -50%) translateY(${(1 - fixIn) * 10}px)`,
              opacity: fixIn,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <FolderTree size={54} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              split directories instead
            </div>
            <Checkmark progress={fixIn} size={48} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
