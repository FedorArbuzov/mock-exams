import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {RefreshCw} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Typed: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const midIn = progress01(frame, 28, 46);
  const rightIn = progress01(frame, 48, 70);
  const checkIn = progress01(frame, 78, 98);
  const iotaStep = Math.min(2, Math.floor(frame / 18) % 4);

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
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <RefreshCw size={56} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                padding: "14px 22px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 46,
                fontWeight: 800,
              }}
            >
              iota → {iotaStep}
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              resets
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 240,
              transform: "translate(-50%, -50%)",
              opacity: midIn,
            }}
          >
            <Arrow direction="right" size={50} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 740,
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                padding: "16px 22px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              type Status int
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              typed
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 500,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={48} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              Status values, not bare ints
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
