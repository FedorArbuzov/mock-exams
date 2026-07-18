import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileCode, Folder, TestTube} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const folderIn = progress01(frame, 0, 18);
  const filesIn = progress01(frame, 24, 44);
  const xIn = progress01(frame, 50, 66);
  const labelIn = progress01(frame, 66, 82);
  const testIn = progress01(frame, 92, 110);

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
        <Panel width={900} height={840}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 110,
              transform: `translate(-50%, -50%) translateY(${(1 - folderIn) * 12}px)`,
              opacity: folderIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Folder size={76} color={COLORS.white} strokeWidth={1.5} />
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
              one directory
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 300,
              top: 320,
              transform: `translate(-50%, -50%) translateY(${(1 - filesIn) * 12}px)`,
              opacity: filesIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FileCode size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              package foo
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 600,
              top: 320,
              transform: `translate(-50%, -50%) translateY(${(1 - filesIn) * 12}px)`,
              opacity: filesIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FileCode size={64} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              package bar
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 300,
              transform: "translate(-50%, -50%)",
              opacity: xIn,
              color: COLORS.red,
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            ✕
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 460,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 26,
              fontWeight: 750,
            }}
          >
            won&apos;t compile
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 580,
              width: 900,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 680,
              transform: `translate(-50%, -50%) translateY(${(1 - testIn) * 10}px)`,
              opacity: testIn,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <TestTube size={54} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 650}}>
              separate test files — allowed
            </div>
            <Checkmark progress={testIn} size={44} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
