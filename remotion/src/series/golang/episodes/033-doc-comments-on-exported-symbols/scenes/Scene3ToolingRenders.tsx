import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {BookOpen, Globe, Terminal} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3ToolingRenders: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const sourceIn = progress01(frame, 0, 20);
  const branchIn = progress01(frame, 30, 50);
  const outIn = progress01(frame, 68, 88);

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
        <Panel width={900} height={800}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 110,
              transform: `translate(-50%, -50%) translateY(${(1 - sourceIn) * 10}px)`,
              opacity: sourceIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <BookOpen size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              doc comment
            </div>
          </div>

          <svg
            width={900}
            height={220}
            style={{position: "absolute", left: 0, top: 200, opacity: branchIn}}
          >
            <line x1={450} y1={0} x2={260} y2={200} stroke={COLORS.border} strokeWidth={2} />
            <line x1={450} y1={0} x2={640} y2={200} stroke={COLORS.border} strokeWidth={2} />
          </svg>

          <div
            style={{
              position: "absolute",
              left: 260,
              top: 440,
              transform: `translate(-50%, -50%) translateY(${(1 - branchIn) * 10}px)`,
              opacity: branchIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Terminal size={70} color={COLORS.white} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              go doc
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 640,
              top: 440,
              transform: `translate(-50%, -50%) translateY(${(1 - branchIn) * 10}px)`,
              opacity: branchIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Globe size={70} color={COLORS.white} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              pkg.go.dev
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 640,
              transform: "translate(-50%, -50%)",
              opacity: outIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={outIn} size={54} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              rendered documentation
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
