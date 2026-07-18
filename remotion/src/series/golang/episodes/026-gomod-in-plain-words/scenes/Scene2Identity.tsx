import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ShieldCheck} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const FIELDS = [
  {label: "module path", value: "github.com/you/app"},
  {label: "go version", value: "1.23"},
  {label: "dependencies", value: "3 listed"},
];

export const Scene2Identity: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cardIn = progress01(frame, 0, 20);
  const sealIn = progress01(frame, 70, 90);

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
        <Panel width={860} height={700}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 50,
              width: 780,
              borderRadius: 20,
              border: `2px solid ${COLORS.cyan}`,
              background: "rgba(34,211,238,0.06)",
              boxShadow: `0 0 26px ${COLORS.glowCyan}`,
              opacity: cardIn,
              transform: `scale(${0.94 + cardIn * 0.06})`,
              padding: "28px 34px",
            }}
          >
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 1,
                marginBottom: 20,
              }}
            >
              go.mod
            </div>

            {FIELDS.map((f, i) => {
              const delay = 20 + i * 18;
              const rowIn = progress01(frame, delay, delay + 14);
              return (
                <div
                  key={f.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 0",
                    borderTop: i > 0 ? `1px solid ${COLORS.border}` : undefined,
                    opacity: rowIn,
                  }}
                >
                  <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 650}}>
                    {f.label}
                  </div>
                  <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
                    {f.value}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 560,
              transform: "translate(-50%, -50%)",
              opacity: sealIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <ShieldCheck size={54} color={COLORS.green} strokeWidth={1.7} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              go.sum — checksums sealed
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
