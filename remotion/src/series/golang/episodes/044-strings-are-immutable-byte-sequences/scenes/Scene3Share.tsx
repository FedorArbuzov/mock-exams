import React from "react";

import {AbsoluteFill, useCurrentFrame} from "remotion";

import {Share2, Type, XCircle, Zap} from "lucide-react";

import {COLORS, FONTS} from "../../../../../shared/constants";

import {Caption} from "../../../../../shared/components/Caption";

import {Checkmark} from "../../../../../shared/components/Checkmark";

import {Panel} from "../../../../../shared/components/Panel";

import {progress01} from "../../../../../shared/utils/animations";



type Props = {text: string; durationInFrames: number};



export const Scene3Share: React.FC<Props> = ({text, durationInFrames}) => {

  const frame = useCurrentFrame();

  const leftIn = progress01(frame, 0, 24);

  const checkIn = progress01(frame, 28, 48);

  const rightIn = progress01(frame, 52, 72);

  const crossIn = progress01(frame, 72, 92);



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

        <Panel width={960} height={720}>

          <div

            style={{

              position: "absolute",

              left: 240,

              top: 260,

              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,

              opacity: leftIn,

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              gap: 18,

            }}

          >

            <div style={{position: "relative", display: "flex", alignItems: "center", gap: 10}}>

              <Type size={64} color={COLORS.cyan} strokeWidth={1.6} />

              <Share2 size={48} color={COLORS.cyan} strokeWidth={1.6} />

            </div>

            <div

              style={{

                display: "flex",

                alignItems: "center",

                gap: 14,

                opacity: checkIn,

              }}

            >

              <Checkmark progress={checkIn} size={44} />

              <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>

                safe to share

              </div>

            </div>

          </div>



          <div

            style={{

              position: "absolute",

              left: "50%",

              top: 260,

              width: 1,

              height: 280,

              background: COLORS.border,

              opacity: (leftIn + rightIn) / 2,

            }}

          />



          <div

            style={{

              position: "absolute",

              left: 720,

              top: 260,

              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,

              opacity: rightIn,

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              gap: 18,

            }}

          >

            <div style={{position: "relative"}}>

              <div

                style={{

                  padding: "14px 22px",

                  borderRadius: 12,

                  border: `1.5px solid ${COLORS.border}`,

                  color: COLORS.muted,

                  fontFamily: FONTS.sans,

                  fontSize: 34,

                  fontWeight: 700,

                  textDecoration: crossIn > 0.15 ? "line-through" : "none",

                  opacity: 0.55 + (1 - crossIn) * 0.45,

                }}

              >

                mutable strings

              </div>

              <div style={{position: "absolute", right: -16, top: -16, opacity: crossIn}}>

                <XCircle size={36} color={COLORS.red} fill={COLORS.background} strokeWidth={1.8} />

              </div>

            </div>

            <div style={{display: "flex", alignItems: "center", gap: 10, opacity: crossIn}}>

              <Zap size={40} color={COLORS.muted} strokeWidth={1.6} />

              <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>

                surprise

              </div>

            </div>

          </div>

        </Panel>

      </div>



      <Caption text={text} durationInFrames={durationInFrames} />

    </AbsoluteFill>

  );

};


