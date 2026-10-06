// Objeto del hero: esfera de alto detalle desplazada por ruido 3D.
// Recalcula la normal por diferencias finitas sobre la esfera para que la
// iluminación siga la superficie deformada (si no, el blob se ve "plano").

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise;

uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uIntensity;

// ---------- Simplex noise 3D (Ashima / Stefan Gustavson) ----------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 pa = vec3(a0.xy, h.x);
  vec3 pb = vec3(a0.zw, h.y);
  vec3 pc = vec3(a1.xy, h.z);
  vec3 pd = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(pa, pa), dot(pb, pb), dot(pc, pc), dot(pd, pd)));
  pa *= norm.x; pb *= norm.y; pc *= norm.z; pd *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(pa, x0), dot(pb, x1), dot(pc, x2), dot(pd, x3)));
}

float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Desplazamiento para un punto sobre la esfera unitaria.
float displace(vec3 p) {
  return fbm(p * uFreq + vec3(0.0, uTime * 0.25, 0.0));
}

vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z)
    ? vec3(-v.y, v.x, 0.0)
    : vec3(0.0, -v.z, v.y));
}

void main() {
  vec3 n = normalize(normal);
  float d = displace(position);
  vNoise = d;

  float amp = uAmp * uIntensity;
  vec3 pos = position + n * d * amp;

  // Normal recalculada: desplazo dos vecinos sobre la esfera y tomo el cross.
  float eps = 0.02;
  vec3 t = orthogonal(n);
  vec3 b = normalize(cross(n, t));
  vec3 nb1 = normalize(position + t * eps);
  vec3 nb2 = normalize(position + b * eps);
  vec3 p1 = nb1 + nb1 * displace(nb1) * amp;
  vec3 p2 = nb2 + nb2 * displace(nb2) * amp;
  vec3 newN = normalize(cross(p1 - pos, p2 - pos));
  if (dot(newN, n) < 0.0) newN = -newN;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * newN);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
