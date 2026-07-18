import React from "react";

import {AbsoluteFill, useCurrentFrame} from "remotion";

import {FileCode, Regex, Route} from "lucide-react";

import {COLORS} from "../../../../../shared/constants";

import {Caption} from "../../../../../shared/components/Caption";

import {Panel} from "../../../../../shared/components/Panel";

import {fadeSlideUpWith, progress01} from "../../../../../shared/utils/animations";



type Props = {text: string; durationInFrames: number};



const RINGS = [140, 220, 300];



const ICONS = [

  {Icon: FileCode, x: 220},

  {Icon: Regex, x: 480},

  {Icon: Route, x: 740},

] as const;



export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {

  const frame = useCurrentFrame();

  const panelIn = progress01(frame, 0, 20);

  const markIn = progress01(frame, durationInFrames * 0.35, durationInFrames * 0.6);



  return (

    <AbsoluteFill>

      <div

        style={{

          position: "absolute",

          left: "50%",

          top: 780,

          transform: `translate(-50%, -50%) scale(${0.94 + panelIn * 0.06})`,

          opacity: panelIn,

        }}

      >

        <Panel width={780} height={760}>

          {RINGS.map((r, i) => {

            const pulse = 0.5 + 0.5 * Math.sin(frame * 0.05 - i * 1.1);

            return (

              <div

                key={r}

                style={{

                  position: "absolute",

                  left: "50%",

                  top: "42%",

                  width: r,

                  height: r,

                  transform: "translate(-50%, -50%)",

                  borderRadius: 999,

                  border: `2px solid ${COLORS.cyan}`,

                  opacity: 0.12 + pulse * 0.18,

                }}

              />

            );

          })}



          {ICONS.map(({Icon, x}, i) => (

            <div

              key={x}

              style={{

                position: "absolute",

                left: x,

                top: "42%",

                ...fadeSlideUpWith("translate(-50%, -50%)", frame, i * 8, 18 + i * 8),

              }}

            >

              <Icon size={100} color={COLORS.cyan} strokeWidth={1.5} />

            </div>

          ))}



          <div

            style={{

              position: "absolute",

              left: "50%",

              top: "70%",

              transform: "translate(-50%, -50%)",

              color: COLORS.cyan,

              fontSize: 54,

              fontWeight: 800,

              opacity: markIn * (0.75 + Math.sin(frame * 0.12) * 0.2),

              textShadow: `0 0 16px ${COLORS.glowCyan}`,

            }}

          >

            paste?

          </div>

        </Panel>

      </div>



      <Caption text={text} durationInFrames={durationInFrames} />

    </AbsoluteFill>

  );

};

