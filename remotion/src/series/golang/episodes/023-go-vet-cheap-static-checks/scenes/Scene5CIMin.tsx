import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlignLeft, FlaskConical, SearchCheck} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STAGES = [
  {label: "format check", Icon: AlignLeft},
  {label: "go vet", Icon: SearchCheck},
  {label: "go test", Icon: FlaskConical},
];

export const Scene5CIMin: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const mergeIn = progress01(frame, 90, 108);

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
        <Panel width={960} height={440}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 70,
              width: 960,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            {STAGES.map((s, i) => {
              const delay = 6 + i * 26;
              const nodeIn = progress01(frame, delay, delay + 16);
              const arrowIn = progress01(frame, delay + 14, delay + 28);
              const checkIn = progress01(frame, delay + 20, delay + 36);
              const Icon = s.Icon;
              return (
                <React.Fragment key={s.label}>
                  <div
                    style={{
                      opacity: nodeIn,
                      transform: `translateY(${(1 - nodeIn) * 14}px)`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Icon size={70} color={COLORS.cyan} strokeWidth={1.6} />
                    <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
                      {s.label}
                    </div>
                    <Checkmark progress={checkIn} size={40} />
                  </div>
                  {i < STAGES.length - 1 && (
                    <div style={{opacity: arrowIn}}>
                      <Arrow direction="right" size={38} color={COLORS.muted} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 340,
              transform: "translate(-50%, -50%)",
              opacity: mergeIn,
              padding: "14px 30px",
              borderRadius: 999,
              border: `2px solid ${COLORS.green}`,
              background: "rgba(52,211,153,0.1)",
              color: COLORS.green,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 750,
            }}
          >
            merge allowed
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
