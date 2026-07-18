import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Archive, Boxes} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Mechanism: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 34, 54);
  const labelIn = progress01(frame, 66, 86);

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
        <Panel width={960} height={780}>
          <div
            style={{
              position: "absolute",
              left: 240,
              top: 200,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Boxes size={78} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, textAlign: "center"}}>
              remote
              <br />
              registry
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 200,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
            }}
          >
            <Arrow direction="right" size={50} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 660,
              top: 130,
              width: 260,
              height: 220,
              border: `1.5px solid ${COLORS.cyan}88`,
              borderRadius: 16,
              opacity: rightIn,
              transform: `translate(-50%, 0) translateY(${(1 - rightIn) * 12}px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 660,
              top: 200,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Archive size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              vendored copy
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 460,
              transform: `translate(-50%, -50%) translateY(${(1 - labelIn) * 10}px)`,
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            exact files, hermetic builds
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
