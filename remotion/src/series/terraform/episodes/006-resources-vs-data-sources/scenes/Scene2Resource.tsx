import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Plus, RefreshCw, Trash2} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {Arrow} from "../../../../../shared/components/Arrow";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CYCLE = [
  {label: "create", icon: Plus, color: COLORS.green},
  {label: "update", icon: RefreshCw, color: COLORS.cyan},
  {label: "delete", icon: Trash2, color: COLORS.red},
] as const;

export const Scene2Resource: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cardIn = progress01(frame, 0, 22);
  const cycleIn = progress01(frame, 26, 54);
  const stateIn = progress01(frame, 58, 82);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 200,
              transform: `translate(-50%, -50%) translateY(${(1 - cardIn) * 12}px)`,
              opacity: cardIn,
              padding: "20px 28px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.cyan}88`,
              background: "rgba(15, 23, 42, 0.65)",
              color: COLORS.cyan,
              fontFamily: FONTS.mono,
              fontSize: 42,
              fontWeight: 780,
            }}
          >
            resource "aws_instance" "web"
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 380,
              transform: "translate(-50%, -50%)",
              opacity: cycleIn,
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}
          >
            {CYCLE.map((step, i) => {
              const stepIn = progress01(frame, 28 + i * 10, 46 + i * 10);
              const Icon = step.icon;
              return (
                <React.Fragment key={step.label}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      opacity: stepIn,
                      transform: `translateY(${(1 - stepIn) * 10}px)`,
                    }}
                  >
                    <Icon size={44} color={step.color} strokeWidth={1.6} />
                    <div style={{color: step.color, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
                      {step.label}
                    </div>
                  </div>
                  {i < CYCLE.length - 1 && (
                    <Arrow direction="right" size={32} color={COLORS.muted} style={{opacity: stepIn}} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 560,
              transform: "translate(-50%, -50%)",
              opacity: stateIn,
              padding: "16px 32px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.green}88`,
              color: COLORS.green,
              fontFamily: FONTS.mono,
              fontSize: 40,
              fontWeight: 750,
              textShadow: `0 0 12px ${COLORS.glowGreen}`,
            }}
          >
            tracked in state
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
