import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../shared/constants";
import {Caption} from "../../../shared/components/Caption";
import {Panel} from "../../../shared/components/Panel";
import {progress01} from "../../../shared/utils/animations";

type Props = {
  text: string;
  durationInFrames: number;
  stamp: string;
};

/** Scene 5: memorable rule stamp. */
export const TemplateRule: React.FC<Props> = ({text, durationInFrames, stamp}) => {
  const frame = useCurrentFrame();
  const t = progress01(frame, 0, 28);
  const pulse = 0.92 + 0.08 * Math.sin(frame * 0.1);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "48%",
              width: 820,
              transform: `translate(-50%, -50%) scale(${t * pulse})`,
              opacity: t,
              padding: "48px 40px",
              borderRadius: 20,
              border: `2.5px solid ${COLORS.cyan}`,
              background: "rgba(15, 23, 42, 0.75)",
              boxShadow: `0 0 40px ${COLORS.glowCyan}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: COLORS.muted,
                fontFamily: FONTS.sans,
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: 3,
                marginBottom: 22,
              }}
            >
              RULE
            </div>
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.sans,
                fontSize: stamp.length > 28 ? 42 : 50,
                fontWeight: 820,
                lineHeight: 1.25,
                textShadow: `0 0 18px ${COLORS.glowCyan}`,
              }}
            >
              {stamp}
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
