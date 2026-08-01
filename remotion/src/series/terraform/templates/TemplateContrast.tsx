import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../shared/constants";
import {Caption} from "../../../shared/components/Caption";
import {Panel} from "../../../shared/components/Panel";
import {progress01} from "../../../shared/utils/animations";

type Props = {
  text: string;
  durationInFrames: number;
  bad: string;
  good: string;
};

/** Scene 4: bad vs good contrast. */
export const TemplateContrast: React.FC<Props> = ({
  text,
  durationInFrames,
  bad,
  good,
}) => {
  const frame = useCurrentFrame();
  const left = progress01(frame, 0, 24);
  const right = progress01(frame, 28, 52);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: 240,
              top: "48%",
              transform: `translate(-50%, -50%) translateY(${(1 - left) * 14}px)`,
              opacity: left,
              width: 360,
              padding: "36px 28px",
              borderRadius: 16,
              border: `2px solid ${COLORS.red}`,
              background: "rgba(248, 113, 113, 0.08)",
              textAlign: "center",
            }}
          >
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 720, marginBottom: 16}}>
              avoid
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 40, fontWeight: 780, lineHeight: 1.25}}>
              {bad}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 720,
              top: "48%",
              transform: `translate(-50%, -50%) translateY(${(1 - right) * 14}px)`,
              opacity: right,
              width: 360,
              padding: "36px 28px",
              borderRadius: 16,
              border: `2px solid ${COLORS.green}`,
              background: "rgba(52, 211, 153, 0.1)",
              boxShadow: `0 0 22px ${COLORS.glowGreen}`,
              textAlign: "center",
            }}
          >
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 720, marginBottom: 16}}>
              prefer
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 40, fontWeight: 780, lineHeight: 1.25}}>
              {good}
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
