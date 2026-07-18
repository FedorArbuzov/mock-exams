import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4NotDecoration: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 14, 34);

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
        <Panel width={940} height={700}>
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              lib/v3
            </div>
            <Checkmark progress={leftIn} size={44} />
            <div
              style={{
                color: COLORS.green,
                fontFamily: FONTS.sans,
                fontSize: 19,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              real version marker
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 220,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.border}`,
                color: COLORS.muted,
                fontFamily: FONTS.mono,
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              lib-final
            </div>
            <div style={{color: COLORS.red, fontSize: 26, fontWeight: 800}}>✕</div>
            <div
              style={{
                color: COLORS.muted,
                fontFamily: FONTS.sans,
                fontSize: 19,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              not how Go tracks it
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
