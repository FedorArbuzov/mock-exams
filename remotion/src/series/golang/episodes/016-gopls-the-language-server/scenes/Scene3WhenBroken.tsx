import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Download, FolderOpen, RefreshCw} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CODE = 'result := doWork()';

const FIXES = [
  {label: "open module root", Icon: FolderOpen},
  {label: "go mod tidy", Icon: RefreshCw},
  {label: "update gopls", Icon: Download},
];

const squigglePath = (x: number, y: number, width: number) => {
  const segments = 10;
  let d = `M${x} ${y}`;
  for (let i = 1; i <= segments; i++) {
    const px = x + (width / segments) * i;
    const py = y + (i % 2 === 0 ? 5 : -5);
    d += ` L${px} ${py}`;
  }
  return d;
};

export const Scene3WhenBroken: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 18);
  const squiggleIn = progress01(frame, 16, 32);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 950,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={880} height={1000}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 40,
              width: 800,
              borderRadius: 18,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(7,12,24,0.9)",
              opacity: codeIn,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "12px 18px",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              {["#F87171", "#FBBF24", "#34D399"].map((c) => (
                <div key={c} style={{width: 11, height: 11, borderRadius: 99, background: c}} />
              ))}
            </div>
            <div style={{padding: "26px 30px", position: "relative"}}>
              <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 28}}>{CODE}</div>
              <svg width={280} height={16} style={{position: "absolute", left: 30, top: 60}}>
                <path
                  d={squigglePath(0, 8, 280)}
                  stroke={COLORS.red}
                  strokeWidth={2.4}
                  fill="none"
                  opacity={squiggleIn}
                />
              </svg>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 40,
              top: 210,
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 700,
              opacity: squiggleIn,
            }}
          >
            false error — valid code
          </div>

          {FIXES.map((fix, i) => {
            const delay = 40 + i * 22;
            const rowIn = progress01(frame, delay, delay + 14);
            const checkIn = progress01(frame, delay + 10, delay + 26);
            const Icon = fix.Icon;
            return (
              <div
                key={fix.label}
                style={{
                  position: "absolute",
                  left: 40,
                  top: 320 + i * 190,
                  width: 800,
                  transform: `translateY(${(1 - rowIn) * 14}px)`,
                  opacity: rowIn,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 24px",
                }}
              >
                <div style={{display: "flex", alignItems: "center", gap: 26}}>
                  <Icon size={64} color={COLORS.cyan} strokeWidth={1.8} />
                  <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 28, fontWeight: 600}}>
                    {fix.label}
                  </div>
                </div>
                <Checkmark progress={checkIn} size={70} />
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
