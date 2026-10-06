precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;      // puntero suavizado, 0..1
uniform float uScroll;     // progreso de scroll 0..1
uniform vec3  uColorA;     // paper (base clara)
uniform vec3  uColorB;     // tinte suave
uniform vec3  uColorC;     // acento vivo (cambia por sección)
uniform vec3  uTint;       // neblina de color de la sección activa
uniform float uIntensity;  // 0 en reduce-motion, 1 normal

// ---------- Simplex noise 2D (Ashima / Stefan Gustavson) ----------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                          dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    value += amp * snoise(p);
    p = rot * p * 2.0;
    amp *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  float t = uTime * 0.045 * uIntensity;

  // Domain warping.
  vec2 q = vec2(fbm(p + vec2(0.0, t)),
                fbm(p + vec2(5.2, 1.3 - t)));

  vec2 mouseOffset = (uMouse - 0.5) * 0.7 * uIntensity;
  vec2 r = vec2(fbm(p + 2.0 * q + vec2(1.7, 9.2) + mouseOffset + 0.15 * t),
                fbm(p + 2.0 * q + vec2(8.3, 2.8) - 0.12 * t));

  float f = fbm(p + 2.5 * r);
  f = f * 0.5 + 0.5;

  // ---- PALETA CLARA ----
  // Base: casi siempre "paper", con un tinte suave en zonas medias.
  vec3 col = mix(uColorA, uColorB, smoothstep(0.30, 0.78, f));

  // El acento aparece como "tinta" en los pliegues del warp,
  // concentrado arriba (hero) para no tapar el texto del resto.
  float topMask = smoothstep(-0.1, 0.9, uv.y);      // 1 arriba, 0 abajo
  float scrollFade = 1.0 - uScroll * 0.55;          // se calma al bajar
  float swirl = smoothstep(0.45, 0.95, length(r) * 0.7);
  col = mix(col, uColorC, swirl * topMask * scrollFade * 0.85 * uIntensity);

  // Halo suave del acento en los núcleos del warp.
  col += uColorC * pow(clamp(dot(q, r), 0.0, 1.0), 2.0)
         * 0.25 * topMask * uIntensity;

  // Neblina de color por sección: aparece en las zonas densas del ruido,
  // así cambia de forma orgánica al scrollear (no un overlay plano).
  col = mix(col, uTint, 0.16 * f);

  // Viñeta tenue: oscurece apenas los bordes (sensación de papel).
  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
  col *= mix(0.92, 1.0, vig);

  // Grano fino contra el banding en degradados claros.
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)))
                      * 43758.5453 + uTime);
  col += (grain - 0.5) * 0.02;

  gl_FragColor = vec4(col, 1.0);
}
