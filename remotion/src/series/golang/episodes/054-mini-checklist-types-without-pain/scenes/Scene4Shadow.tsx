import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Layers, Type} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Shadow: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const shadowIn = progress01(frame, 0, 24);
  const stringIn = progress01(frame, 28, 48);
  const ptrIn = progress01(frame, 52, 72);

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
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 200,
              transform: `translate(-50%, -50%) translateY(${(1 - shadowIn) * 12}px)`,
              opacity: shadowIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 24px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.red}66`,
            }}
          >
            <Layers size={44} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 42, fontWeight: 750}}>
              err :=
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              shadowed?
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 360,
              transform: `translate(-50%, -50%) translateY(${(1 - stringIn) * 12}px)`,
              opacity: stringIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 24px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.cyan}88`,
            }}
          >
            <Type size={44} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700}}>
              len vs runes
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: `translate(-50%, -50%) translateY(${(1 - ptrIn) * 12}px)`,
              opacity: ptrIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 24px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.green}88`,
            }}
          >
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 42, fontWeight: 750}}>
              p != nil
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              nil path
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
