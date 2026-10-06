// Helpers numéricos compartidos por los módulos de motion / GL.

export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/**
 * Interpolación independiente del framerate.
 * `smoothing` ~ fracción que falta por recorrer tras 60ms.
 * `dt` en segundos. Evita el clásico "lerp atado a 60fps".
 */
export const damp = (current, target, smoothing, dt) =>
  lerp(current, target, 1 - Math.pow(smoothing, dt));

export const map = (v, inMin, inMax, outMin, outMax) =>
  outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin);

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
