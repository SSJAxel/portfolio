precision highp float;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise;

uniform vec3 uColorBase; // color principal del cuerpo
uniform vec3 uColorAlt;  // segundo color (iridiscencia por ruido)
uniform vec3 uColorRim;  // borde / fresnel
uniform float uOpacity;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDir);

  // Fresnel: brilla en los bordes vistos de canto.
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.5);

  // Difusa simple para dar volumen (luz fija arriba-derecha).
  vec3 L = normalize(vec3(0.6, 0.85, 0.5));
  float diff = clamp(dot(N, L), 0.0, 1.0) * 0.6 + 0.4;

  // El ruido mezcla entre los dos colores base -> look iridiscente.
  vec3 base = mix(uColorBase, uColorAlt, smoothstep(-0.5, 0.6, vNoise));

  vec3 col = base * diff;
  col += uColorRim * fres * 1.2;

  gl_FragColor = vec4(col, uOpacity);
}
