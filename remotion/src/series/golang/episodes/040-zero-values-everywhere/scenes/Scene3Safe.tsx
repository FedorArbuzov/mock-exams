import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Link2Off} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Safe: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 22);
  const checkIn = progress01(frame, 34, 54);
  const sliceIn = progress01(frame, 78, 98);
  const appendIn = progress01(frame, 108, 128);

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
        <Panel width={950} height={800}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 130,
              transform: `translate(-50%, -50%) translateY(${(1 - codeIn) * 10}px)`,
              opacity: codeIn,
              padding: "16px 24px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.cyan}88`,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            var buf bytes.Buffer
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={48} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
              ready to use immediately
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
              left: 220,
              top: 540,
              transform: `translate(-50%, -50%) translateY(${(1 - sliceIn) * 12}px)`,
              opacity: sliceIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Link2Off size={70} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 34, fontWeight: 700}}>
              nil slice
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: "translate(-50%, -50%)",
              opacity: appendIn,
            }}
          >
            <Arrow direction="right" size={46} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 730,
              top: 540,
              transform: `translate(-50%, -50%) translateY(${(1 - appendIn) * 12}px)`,
              opacity: appendIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Checkmark progress={appendIn} size={50} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              append works fine
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
