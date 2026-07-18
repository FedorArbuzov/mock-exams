import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = [
  {code: "type Status int", color: COLORS.muted},
  {code: "const (", color: COLORS.white},
  {code: "  StatusPending = iota  // 0", color: COLORS.cyan},
  {code: "  StatusActive          // 1", color: COLORS.white},
  {code: "  StatusDone            // 2", color: COLORS.white},
  {code: ")", color: COLORS.white},
];

export const Scene2IotaBlock: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const labelIn = progress01(frame, 90, 110);

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
        <Panel width={1000} height={820}>
          {LINES.map((line, i) => {
            const lineIn = progress01(frame, 8 + i * 12, 26 + i * 12);
            return (
              <div
                key={line.code}
                style={{
                  position: "absolute",
                  left: 56,
                  top: 90 + i * 88,
                  opacity: lineIn,
                  transform: `translateY(${(1 - lineIn) * 10}px)`,
                  color: line.color,
                  fontFamily: FONTS.mono,
                  fontSize: 42,
                  fontWeight: 700,
                  whiteSpace: "pre",
                  textShadow:
                    line.color === COLORS.cyan ? `0 0 14px ${COLORS.glowCyan}` : undefined,
                }}
              >
                {line.code}
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 680,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 34,
              fontWeight: 750,
            }}
          >
            iota = 0, 1, 2
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
