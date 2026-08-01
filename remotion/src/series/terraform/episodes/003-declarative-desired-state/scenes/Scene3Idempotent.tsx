import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {CheckCircle2, Copy, RefreshCw} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Idempotent: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 24);
  const applyIn = progress01(frame, 28, 48);
  const noChangeIn = progress01(frame, 52, 72);
  const rightIn = progress01(frame, 56, 80);

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
              left: 280,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <RefreshCw size={56} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                padding: "16px 28px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 800,
                opacity: applyIn,
              }}
            >
              apply again
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 280,
              width: 1,
              height: 200,
              background: COLORS.border,
              opacity: (leftIn + rightIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - noChangeIn) * 12}px)`,
              opacity: noChangeIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <CheckCircle2 size={56} color={COLORS.green} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 800,
                textShadow: `0 0 16px ${COLORS.glowGreen}`,
              }}
            >
              No changes
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Copy size={40} color={COLORS.red} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.red,
                fontFamily: FONTS.sans,
                fontSize: 36,
                fontWeight: 750,
              }}
            >
              scripts → duplicates
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
