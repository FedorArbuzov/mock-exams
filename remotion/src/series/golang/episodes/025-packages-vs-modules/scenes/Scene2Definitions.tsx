import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Folder, Tag} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Definitions: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={900} height={640}>
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
              gap: 18,
            }}
          >
            <Tag size={80} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 30, fontWeight: 700}}>
              module
            </div>
            <div
              style={{
                color: COLORS.white,
                fontFamily: FONTS.sans,
                fontSize: 22,
                fontWeight: 600,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              versioned unit —
              <br />
              your whole repo
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 480,
              top: 60,
              width: 380,
              opacity: rightIn,
              transform: `translateY(${(1 - rightIn) * 14}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <Folder size={80} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 30, fontWeight: 700}}>
              package
            </div>
            <div
              style={{
                color: COLORS.white,
                fontFamily: FONTS.sans,
                fontSize: 22,
                fontWeight: 600,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              one directory,
              <br />
              one package name
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
