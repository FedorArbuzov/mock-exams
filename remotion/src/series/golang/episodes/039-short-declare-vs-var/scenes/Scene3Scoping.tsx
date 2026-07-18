import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {TriangleAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Scoping: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const outerIn = progress01(frame, 0, 20);
  const innerIn = progress01(frame, 34, 54);
  const warnIn = progress01(frame, 66, 86);

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
        <Panel width={940} height={820}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 80,
              width: 820,
              height: 560,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 16,
              opacity: outerIn,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 60,
              opacity: outerIn,
              color: COLORS.muted,
              fontFamily: FONTS.mono,
              fontSize: 30,
              fontWeight: 700,
              background: COLORS.background,
              padding: "0 8px",
            }}
          >
            outer scope
          </div>
          <div
            style={{
              position: "absolute",
              left: 150,
              top: 160,
              opacity: outerIn,
              padding: "12px 20px",
              borderRadius: 10,
              border: `1.5px solid ${COLORS.border}`,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            var err error
          </div>

          <div
            style={{
              position: "absolute",
              left: 150,
              top: 300,
              width: 660,
              height: 260,
              border: `1.5px solid ${COLORS.cyan}88`,
              borderRadius: 14,
              opacity: innerIn,
              transform: `translateY(${(1 - innerIn) * 12}px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 180,
              top: 280,
              opacity: innerIn,
              color: COLORS.cyan,
              fontFamily: FONTS.mono,
              fontSize: 30,
              fontWeight: 700,
              background: COLORS.background,
              padding: "0 8px",
            }}
          >
            if block
          </div>
          <div
            style={{
              position: "absolute",
              left: 230,
              top: 390,
              opacity: innerIn,
              transform: `translateY(${(1 - innerIn) * 12}px)`,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: `1.5px solid ${COLORS.cyan}`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              err := do()
            </div>
            <TriangleAlert size={40} color={COLORS.red} strokeWidth={1.8} style={{opacity: warnIn}} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 720,
              transform: `translate(-50%, -50%) translateY(${(1 - warnIn) * 10}px)`,
              opacity: warnIn,
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 34,
              fontWeight: 750,
              textAlign: "center",
            }}
          >
            new shadowed variable — not the outer one
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
