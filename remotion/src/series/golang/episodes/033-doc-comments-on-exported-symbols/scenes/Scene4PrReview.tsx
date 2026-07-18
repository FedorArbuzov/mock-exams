import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {TriangleAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4PrReview: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const row1In = progress01(frame, 0, 22);
  const flagIn = progress01(frame, 30, 50);
  const row2In = progress01(frame, 62, 84);
  const approveIn = progress01(frame, 92, 112);

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
        <Panel width={950} height={720}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 100,
              opacity: row1In,
              transform: `translateY(${(1 - row1In) * 10}px)`,
              fontFamily: FONTS.mono,
              fontSize: 26,
              color: COLORS.white,
            }}
          >
            func Charge(amount int) error {"{"}
          </div>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 250,
              opacity: flagIn,
              transform: `translateY(${(1 - flagIn) * 10}px)`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <TriangleAlert size={54} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 750}}>
              undocumented export
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 380,
              width: 950,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 60,
              top: 460,
              opacity: row2In,
              transform: `translateY(${(1 - row2In) * 10}px)`,
              fontFamily: FONTS.mono,
              fontSize: 26,
            }}
          >
            <div style={{color: COLORS.green}}>// Refund reverses a prior charge.</div>
            <div style={{color: COLORS.white}}>func Refund(id string) error {"{"}</div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 620,
              opacity: approveIn,
              transform: `translateY(${(1 - approveIn) * 10}px)`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={approveIn} size={54} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 750}}>
              approved
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
