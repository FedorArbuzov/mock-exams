import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const COLS = 7;
const ROWS = 4;
const HIGHLIGHT_INDEX = 15;

export const Scene2Uniqueness: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const gridIn = progress01(frame, 0, 30);
  const highlightIn = progress01(frame, 40, 60);
  const labelIn = progress01(frame, 64, 82);

  const cellW = 700 / COLS;
  const cellH = 260 / ROWS;

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
        <Panel width={780} height={640}>
          <div style={{position: "absolute", left: 40, top: 60, width: 700, height: 260}}>
            {Array.from({length: COLS * ROWS}).map((_, i) => {
              const delay = Math.floor(i / COLS) * 3 + (i % COLS);
              const dotIn = progress01(frame, delay, delay + 14) * gridIn;
              const isHighlight = i === HIGHLIGHT_INDEX;
              const col = i % COLS;
              const row = Math.floor(i / COLS);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: col * cellW + cellW / 2,
                    top: row * cellH + cellH / 2,
                    transform: `translate(-50%, -50%) scale(${isHighlight ? 0.9 + highlightIn * 0.5 : 1})`,
                    width: isHighlight ? 30 : 16,
                    height: isHighlight ? 30 : 16,
                    borderRadius: 999,
                    background: isHighlight ? COLORS.cyan : COLORS.muted,
                    opacity: isHighlight ? highlightIn : dotIn * 0.5,
                    boxShadow: isHighlight ? `0 0 24px ${COLORS.glowCyan}` : undefined,
                  }}
                />
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 460,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              textAlign: "center",
              width: 700,
            }}
          >
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 28, fontWeight: 700}}>
              your module
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 650, marginTop: 8}}>
              the only one at this address
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
