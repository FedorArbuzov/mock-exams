import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CODE_LINES = [
  {tokens: [{t: "package", c: COLORS.cyan}, {t: " main", c: COLORS.white}]},
  {tokens: [{t: "import", c: COLORS.cyan}, {t: ' "fmt"', c: COLORS.green}]},
  {tokens: [{t: "", c: COLORS.white}]},
  {tokens: [{t: "func", c: COLORS.cyan}, {t: " main() {", c: COLORS.white}]},
  {tokens: [{t: "    fmt.Println(", c: COLORS.white}, {t: '"hello"', c: COLORS.green}, {t: ")", c: COLORS.white}]},
  {tokens: [{t: "}", c: COLORS.white}]},
];

export const Scene5Skeleton: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 18);
  const runIn = progress01(frame, durationInFrames * 0.5, durationInFrames * 0.66);
  const outputIn = progress01(frame, durationInFrames * 0.62, durationInFrames * 0.78);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 840,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={860} height={620}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 40,
              width: 780,
              borderRadius: 18,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(7,12,24,0.92)",
              opacity: codeIn,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "12px 18px",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              {["#F87171", "#FBBF24", "#34D399"].map((c) => (
                <div key={c} style={{width: 11, height: 11, borderRadius: 99, background: c}} />
              ))}
              <div style={{marginLeft: 10, color: COLORS.muted, fontSize: 16, fontFamily: FONTS.mono}}>
                main.go
              </div>
            </div>
            <div style={{padding: "22px 30px"}}>
              {CODE_LINES.map((line, i) => {
                const lineIn = progress01(frame, 6 + i * 6, 14 + i * 6);
                return (
                  <div
                    key={i}
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 25,
                      lineHeight: 1.6,
                      opacity: lineIn,
                      minHeight: 30,
                    }}
                  >
                    {line.tokens.map((tok, j) => (
                      <span key={j} style={{color: tok.c}}>
                        {tok.t}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 40,
              top: 440,
              width: 780,
              borderRadius: 14,
              border: `1.5px solid ${COLORS.cyan}66`,
              background: "rgba(9,14,26,0.9)",
              opacity: runIn,
              overflow: "hidden",
            }}
          >
            <div style={{padding: "18px 26px", fontFamily: FONTS.mono, fontSize: 24}}>
              <div style={{color: COLORS.cyan}}>$ go run .</div>
              <div style={{color: COLORS.white, opacity: outputIn, marginTop: 8}}>hello</div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
