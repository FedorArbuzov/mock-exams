import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Server, UserRound} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Scales: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const personIn = progress01(frame, 0, 20);
  const arrowIn = progress01(frame, 24, 42);
  const targetIn = progress01(frame, 40, 58);
  const checkIn = progress01(frame, 62, 80);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={780} height={680}>
          <div
            style={{
              position: "absolute",
              left: 190,
              top: 160,
              transform: `translate(-50%, -50%) translateY(${(1 - personIn) * 12}px)`,
              opacity: personIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <UserRound size={80} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              new hire
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 160,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
            }}
          >
            <Arrow direction="right" size={54} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 590,
              top: 160,
              transform: `translate(-50%, -50%) translateY(${(1 - targetIn) * 12}px)`,
              opacity: targetIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Server size={80} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              cmd/api
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 420,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={64} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              found in seconds
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
