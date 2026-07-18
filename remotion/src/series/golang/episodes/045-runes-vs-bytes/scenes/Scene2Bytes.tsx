import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = [
  {code: 'len("й")  →  2', label: "bytes", color: COLORS.cyan},
  {code: "range  →  runes", label: "runes", color: COLORS.green},
] as const;

export const Scene2Bytes: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

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
          {LINES.map((line, i) => {
            const lineIn = progress01(frame, 8 + i * 28, 30 + i * 28);
            const labelIn = progress01(frame, 22 + i * 28, 42 + i * 28);
            return (
              <React.Fragment key={line.code}>
                <div
                  style={{
                    position: "absolute",
                    left: 56,
                    top: 220 + i * 180,
                    opacity: lineIn,
                    transform: `translateY(${(1 - lineIn) * 12}px)`,
                    color: line.color,
                    fontFamily: FONTS.mono,
                    fontSize: 50,
                    fontWeight: 800,
                    whiteSpace: "pre",
                    textShadow:
                      line.color === COLORS.cyan ? `0 0 14px ${COLORS.glowCyan}` : `0 0 14px ${COLORS.glowGreen}`,
                  }}
                >
                  {line.code}
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 56,
                    top: 290 + i * 180,
                    opacity: labelIn,
                    transform: `translateY(${(1 - labelIn) * 8}px)`,
                    color: line.color,
                    fontFamily: FONTS.sans,
                    fontSize: 38,
                    fontWeight: 750,
                    letterSpacing: 1,
                  }}
                >
                  {line.label}
                </div>
              </React.Fragment>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
