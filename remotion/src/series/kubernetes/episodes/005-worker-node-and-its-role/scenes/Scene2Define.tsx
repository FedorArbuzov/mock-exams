import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {Pod} from "../../../icons/Pod";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const BADGES = ["CPU", "Memory", "Disk", "kubelet"] as const;

export const Scene2Define: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const nodeIn = progress01(frame, 0, 22);
  const badgeIn = progress01(frame, 20, 48);
  const podIn = progress01(frame, 50, 76);

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
        <Panel width={920} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 140,
              transform: `translate(-50%, -50%) translateY(${(1 - nodeIn) * 12}px)`,
              opacity: nodeIn,
              width: 780,
              padding: "24px 28px",
              borderRadius: 18,
              border: `2px solid ${COLORS.cyan}`,
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 42, fontWeight: 800}}>
              Worker Node
            </div>
            <div style={{display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18}}>
              {BADGES.map((b, i) => {
                const bIn = progress01(frame, 24 + i * 8, 38 + i * 8);
                return (
                  <div
                    key={b}
                    style={{
                      opacity: bIn,
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: `1px solid ${b === "kubelet" ? COLORS.green : COLORS.border}`,
                      color: b === "kubelet" ? COLORS.green : COLORS.white,
                      fontFamily: FONTS.mono,
                      fontSize: 34,
                      fontWeight: 700,
                    }}
                  >
                    {b}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 420,
              transform: `translate(-50%, -50%) scale(${0.9 + badgeIn * 0.1})`,
              opacity: podIn,
              display: "flex",
              gap: 20,
            }}
          >
            <Pod label="app" width={120} height={90} status="healthy" />
            <Pod label="sidecar" width={120} height={90} status="healthy" />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 580,
              transform: "translate(-50%, -50%)",
              opacity: podIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 650,
            }}
          >
            real hardware · real Pods
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
