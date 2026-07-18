import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Box} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2EntryPoint: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const outerIn = progress01(frame, 0, 18);
  const innerIn = progress01(frame, 16, 34);
  const arrowIn = progress01(frame, 36, 54);
  const binaryIn = progress01(frame, 48, 68);

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
        <Panel width={900} height={650}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 90,
              width: 420,
              height: 420,
              borderRadius: 20,
              border: `2px solid ${COLORS.cyan}`,
              opacity: outerIn,
              transform: `scale(${0.94 + outerIn * 0.06})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 20,
                top: -18,
                background: COLORS.background,
                padding: "0 10px",
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              package main
            </div>

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "56%",
                transform: `translate(-50%, -50%) scale(${0.9 + innerIn * 0.1})`,
                opacity: innerIn,
                width: 300,
                height: 190,
                borderRadius: 14,
                border: `2px solid ${COLORS.green}`,
                background: "rgba(52,211,153,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
                func main()
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 540,
              top: 300,
              opacity: arrowIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              go build
            </div>
            <Arrow direction="right" size={60} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 740,
              top: 300,
              transform: `translate(-50%, -50%) scale(${0.9 + binaryIn * 0.1})`,
              opacity: binaryIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Box size={120} color={COLORS.white} strokeWidth={1.5} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              binary
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
