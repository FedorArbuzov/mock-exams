import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ROWS = [
  {label: "logs", before: 'log.Printf("user=', verb: "%s", after: '", name)'},
  {label: "errors", before: 'fmt.Errorf("invalid ', verb: "%s", after: '", field)'},
  {label: "debug", before: 'fmt.Sprintf("state=', verb: "%s", after: '", st)'},
];

export const Scene3WhyItMatters: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={920} height={620}>
          {ROWS.map((row, i) => {
            const delay = 8 + i * 26;
            const rowIn = progress01(frame, delay, delay + 16);
            const verbPulse = 0.5 + 0.5 * Math.sin(frame * 0.15 - i);
            return (
              <div
                key={row.label}
                style={{
                  position: "absolute",
                  left: 40,
                  top: 60 + i * 160,
                  width: 840,
                  opacity: rowIn,
                  transform: `translateY(${(1 - rowIn) * 12}px)`,
                }}
              >
                <div
                  style={{
                    color: COLORS.muted,
                    fontFamily: FONTS.sans,
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    border: `1.5px solid ${COLORS.border}`,
                    background: "rgba(7,12,24,0.9)",
                    padding: "18px 22px",
                    fontFamily: FONTS.mono,
                    fontSize: 24,
                  }}
                >
                  <span style={{color: COLORS.white}}>{row.before}</span>
                  <span
                    style={{
                      color: COLORS.cyan,
                      fontWeight: 800,
                      textShadow: `0 0 ${8 + verbPulse * 10}px ${COLORS.glowCyan}`,
                    }}
                  >
                    {row.verb}
                  </span>
                  <span style={{color: COLORS.white}}>{row.after}</span>
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
