import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {MessagesSquare, User, UserCheck, XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const VOICES = [
  {x: 150, label: "you", Icon: User},
  {x: 450, label: "reviewer", Icon: UserCheck},
  {x: 750, label: "Slack debate", Icon: MessagesSquare},
];

export const Scene2Decision: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const gofmtIn = progress01(frame, 0, 18);
  const checkIn = progress01(frame, 16, 32);

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
        <Panel width={900} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 140,
              transform: `translate(-50%, -50%) scale(${0.9 + gofmtIn * 0.1})`,
              opacity: gofmtIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "20px 40px",
                borderRadius: 18,
                border: `2.5px solid ${COLORS.cyan}`,
                background: "rgba(34,211,238,0.1)",
                boxShadow: `0 0 30px ${COLORS.glowCyan}`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 34,
                fontWeight: 800,
              }}
            >
              gofmt
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 10, opacity: checkIn}}>
              <Checkmark progress={checkIn} size={40} />
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
                final say
              </div>
            </div>
          </div>

          {VOICES.map((v, i) => {
            const delay = 30 + i * 18;
            const nodeIn = progress01(frame, delay, delay + 14);
            const xIn = progress01(frame, delay + 12, delay + 26);
            const Icon = v.Icon;
            return (
              <div
                key={v.label}
                style={{
                  position: "absolute",
                  left: v.x,
                  top: 500,
                  transform: `translate(-50%, -50%) translateY(${(1 - nodeIn) * 14}px)`,
                  opacity: nodeIn,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{position: "relative"}}>
                  <Icon size={76} color={COLORS.muted} strokeWidth={1.6} />
                  <div style={{position: "absolute", right: -16, top: -16, opacity: xIn}}>
                    <XCircle size={38} color={COLORS.red} fill={COLORS.background} strokeWidth={1.8} />
                  </div>
                </div>
                <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 650}}>
                  {v.label}
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
