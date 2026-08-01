import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {MapPin, Route} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const destIn = progress01(frame, 8, 32);
  const routeIn = progress01(frame, 36, 64);
  const labelIn = progress01(frame, 68, 92);

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
        <Panel width={920} height={620} accent={COLORS.green}>
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - destIn) * 14}px)`,
              opacity: destIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <MapPin size={64} color={COLORS.green} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 44,
                fontWeight: 800,
                textShadow: `0 0 16px ${COLORS.glowGreen}`,
              }}
            >
              destination
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 480,
              top: 280,
              opacity: routeIn,
            }}
          >
            <Arrow direction="right" size={48} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 660,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - routeIn) * 14}px)`,
              opacity: routeIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Route size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.sans,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              Terraform routes
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 720,
              textAlign: "center",
              width: 780,
            }}
          >
            declare where, not how
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
