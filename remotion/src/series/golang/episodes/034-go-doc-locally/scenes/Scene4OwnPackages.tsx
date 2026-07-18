import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Folder} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4OwnPackages: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const boxIn = progress01(frame, 0, 20);
  const arrowIn = progress01(frame, 40, 58);
  const tagIn = progress01(frame, 56, 76);
  const checkIn = progress01(frame, 90, 108);

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
        <Panel width={920} height={780}>
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 60,
              width: 740,
              height: 200,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 16,
              opacity: boxIn,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 120,
              top: 40,
              opacity: boxIn,
              color: COLORS.muted,
              fontFamily: FONTS.mono,
              fontSize: 18,
              fontWeight: 700,
              background: COLORS.background,
              padding: "0 8px",
            }}
          >
            your module
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 160,
              width: 920,
              display: "flex",
              justifyContent: "space-evenly",
              opacity: boxIn,
            }}
          >
            {["api", "db", "utils"].map((label) => (
              <div
                key={label}
                style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 8}}
              >
                <Folder size={56} color={COLORS.cyan} strokeWidth={1.6} />
                <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700}}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 340,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
            }}
          >
            <Arrow direction="down" size={46} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 460,
              transform: `translate(-50%, -50%) translateY(${(1 - tagIn) * 10}px)`,
              opacity: tagIn,
              padding: "16px 24px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.cyan}88`,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            go doc ./...
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 600,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={54} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              summarized before publishing
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
