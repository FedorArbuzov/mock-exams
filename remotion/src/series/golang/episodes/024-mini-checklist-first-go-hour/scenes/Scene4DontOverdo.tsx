import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Ban, Wrench} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const SCATTER = [
  {dx: -170, dy: -20, rot: -18},
  {dx: -70, dy: 40, rot: 12},
  {dx: 40, dy: -30, rot: -8},
  {dx: 140, dy: 20, rot: 20},
  {dx: 0, dy: 90, rot: -25},
];

const STEPS = ["edit", "format", "vet", "test", "run"];

export const Scene4DontOverdo: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const clusterIn = progress01(frame, 0, 20);
  const banIn = progress01(frame, 24, 42);
  const stepsIn = progress01(frame, 56, 76);

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
        <Panel width={900} height={780}>
          <div style={{position: "absolute", left: "50%", top: 220, transform: "translate(-50%, -50%)"}}>
            {SCATTER.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: s.dx,
                  top: s.dy,
                  transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
                  opacity: clusterIn * 0.7,
                }}
              >
                <Wrench size={54} color={COLORS.muted} strokeWidth={1.6} />
              </div>
            ))}
            <div style={{opacity: banIn}}>
              <Ban size={130} color={COLORS.red} strokeWidth={1.4} />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 400,
              transform: "translate(-50%, -50%)",
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 700,
              opacity: banIn,
            }}
          >
            not day one
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 540,
              width: 900,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
              opacity: stepsIn,
              transform: `translateY(${(1 - stepsIn) * 14}px)`,
              flexWrap: "wrap",
              padding: "0 40px",
            }}
          >
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  style={{
                    padding: "12px 20px",
                    borderRadius: 999,
                    border: `2px solid ${COLORS.green}`,
                    background: "rgba(52,211,153,0.1)",
                    color: COLORS.green,
                    fontFamily: FONTS.mono,
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {s}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{color: COLORS.muted, fontSize: 22}}>&rarr;</div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 680,
              transform: "translate(-50%, -50%)",
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 700,
              opacity: stepsIn,
            }}
          >
            the core loop
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
