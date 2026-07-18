import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = ["stale cached image", "replicas differ", "guesswork rollback"] as const;

export const Scene3Failure: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const titleIn = progress01(frame, 0, 22);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div style={{position: "absolute", left: "50%", top: 160, transform: "translate(-50%, -50%)", opacity: titleIn, color: COLORS.red, fontFamily: FONTS.mono, fontSize: 44, fontWeight: 800, textShadow: "0 0 16px rgba(248, 113, 113, 0.45)"}}>
            latest breaks
          </div>
          {LINES.map((line, i) => (
            <div
              key={line}
              style={{
                position: "absolute",
                left: "50%",
                top: 280 + i * 110,
                transform: `translate(-50%, -50%) translateY(${(1 - progress01(frame, 18 + i * 12, 36 + i * 12)) * 14}px)`,
                opacity: progress01(frame, 18 + i * 12, 36 + i * 12),
                width: 820,
                padding: "22px 28px",
                borderRadius: 14,
                border: `1.5px solid ${COLORS.border}`,
                background: "rgba(15, 23, 42, 0.55)",
                color: COLORS.white,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 780,
                textAlign: "center",
              }}
            >
              {line}
            </div>
          ))}
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
