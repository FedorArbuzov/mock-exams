import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Tag, TriangleAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5PublishRule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const topIn = progress01(frame, 0, 20);
  const leftIn = progress01(frame, 34, 54);
  const rightIn = progress01(frame, 44, 64);

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
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              breaking API change
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 260,
              top: 420,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Tag size={70} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 19, fontWeight: 700, textAlign: "center"}}>
              just a new tag
            </div>
            <div style={{color: COLORS.red, fontSize: 24, fontWeight: 800}}>✕ not enough</div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 420,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 10,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              lib/v2
            </div>
            <Checkmark progress={rightIn} size={44} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 19, fontWeight: 700}}>
              new major module path
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
