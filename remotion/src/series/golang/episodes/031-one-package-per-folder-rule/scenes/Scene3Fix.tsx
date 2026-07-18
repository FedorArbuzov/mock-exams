import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Folder} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Fix: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const beforeIn = progress01(frame, 0, 20);
  const arrowIn = progress01(frame, 30, 48);
  const afterIn = progress01(frame, 46, 66);
  const checkIn = progress01(frame, 78, 96);

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
        <Panel width={960} height={700}>
          <div
            style={{
              position: "absolute",
              left: 200,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - beforeIn) * 12}px)`,
              opacity: beforeIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Folder size={76} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              foo + bar
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 700}}>
              ✕ one folder
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 220,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Arrow direction="right" size={54} color={COLORS.cyan} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 700}}>
              split
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 190,
              transform: `translate(-50%, -50%) translateY(${(1 - afterIn) * 12}px)`,
              opacity: afterIn,
              display: "flex",
              gap: 36,
            }}
          >
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 8}}>
              <Folder size={62} color={COLORS.cyan} strokeWidth={1.6} />
              <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700}}>
                foo/
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 8}}>
              <Folder size={62} color={COLORS.green} strokeWidth={1.6} />
              <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700}}>
                bar/
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 500,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={60} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              builds stay predictable
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
