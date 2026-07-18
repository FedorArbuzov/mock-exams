import {Easing, interpolate, spring} from "remotion";
import {ANIM} from "../constants";

export const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const fadeSlideUp = (frame: number, start = 0, duration = 18) => {
  const opacity = interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const translateY = interpolate(frame, [start, start + duration], [28, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return {opacity, transform: `translateY(${translateY}px)`};
};

/**
 * Combine fadeSlideUp with a base transform (e.g. "translate(-50%, -50%) rotate(10deg)")
 * without the "spread after an explicit transform silently drops it" bug — always use this
 * instead of `...fadeSlideUp(...)` when the element already has its own `transform`.
 */
export const fadeSlideUpWith = (
  baseTransform: string,
  frame: number,
  start = 0,
  duration = 18,
) => {
  const anim = fadeSlideUp(frame, start, duration);
  return {opacity: anim.opacity, transform: `${baseTransform} ${anim.transform}`};
};

export const softScaleIn = (
  frame: number,
  fps: number,
  delay = 0,
  config = ANIM.enterSpring,
) => {
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config,
  });
  return {
    opacity: progress,
    transform: `scale(${interpolate(progress, [0, 1], [0.88, 1])})`,
  };
};

export const floatY = (frame: number, amplitude: number = ANIM.floatAmplitude, period: number = ANIM.floatPeriod) =>
  Math.sin((frame / period) * Math.PI * 2) * amplitude;

export const progress01 = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

export const pulse = (frame: number, speed = 0.12, min = 0.96, max = 1.04) => {
  const t = (Math.sin(frame * speed) + 1) / 2;
  return interpolate(t, [0, 1], [min, max]);
};
