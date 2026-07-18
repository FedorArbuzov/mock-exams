import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ROWS = [
  {cmd: "go doc fmt.Println", result: "signature + docs"},
  {cmd: "go doc net/http.Client", result: "type docs"},
  {cmd: "go doc -all net/http", result: "everything"},
];

export const Scene2Usage: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={960} height={840}>
          {ROWS.map((row, i) => {
            const delay = 10 + i * 34;
            const rowIn = progress01(frame, delay, delay + 20);
            return (
              <div
                key={row.cmd}
                style={{
                  position: "absolute",
                  left: 60,
                  top: 100 + i * 240,
                  opacity: rowIn,
                  transform: `translateY(${(1 - rowIn) * 10}px)`,
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "16px 22px",
                    borderRadius: 12,
                    border: `1.5px solid ${COLORS.cyan}88`,
                    color: COLORS.white,
                    fontFamily: FONTS.mono,
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {row.cmd}
                </div>
                <div
                  style={{
                    marginTop: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    color: COLORS.green,
                    fontFamily: FONTS.sans,
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  <span style={{color: COLORS.muted}}>→</span> {row.result}
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
