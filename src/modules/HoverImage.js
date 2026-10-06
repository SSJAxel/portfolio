import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  LinearFilter,
  SRGBColorSpace,
} from 'three';
import { damp, clamp, prefersReducedMotion } from '../utils/math.js';

/**
 * Preview de proyecto que sigue al cursor, distorsionada en WebGL.
 *
 * Vive en su PROPIO canvas overlay (z-index alto, pointer-events none) porque
 * debe ir ENCIMA del contenido DOM — el canvas principal está detrás (z-index
 * -1). Cámara ortográfica en coordenadas de píxel: 1 unidad = 1 px.
 *
 * La distorsión se maneja por la velocidad del puntero: ondula las UV, separa
 * los canales RGB (aberración cromática) y el plano llega con lag -> el típico
 * efecto "líquido" de galería. Se apaga en touch / reduce-motion.
 */
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uVelocity;  // velocidad del cursor (unidades normalizadas)
  uniform float uHover;    // 0..1 (fade in/out)
  uniform float uHasTex;   // 1 si hay textura cargada
  varying vec2 vUv;

  void main() {
    float speed = length(uVelocity);

    // Ondulación proporcional a la velocidad.
    vec2 uv = vUv;
    uv.x += sin(uv.y * 9.0 + uVelocity.x * 3.5) * 0.025 * speed;
    uv.y += sin(uv.x * 9.0 + uVelocity.y * 3.5) * 0.025 * speed;

    // Aberración cromática en la dirección del movimiento.
    vec2 shift = uVelocity * 0.02;
    float r = texture2D(uTexture, uv + shift).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - shift).b;

    vec3 col = vec3(r, g, b);
    gl_FragColor = vec4(col, uHover * uHasTex);
  }
`;

export default class HoverImage {
  constructor() {
    this.canvas = document.querySelector('[data-float-gl]');
    this.rows = Array.from(document.querySelectorAll('[data-projects] .project'));
    this.supportsHover = window.matchMedia('(hover: hover)').matches;

    this.enabled = this.canvas && this.rows.length && this.supportsHover;
    if (!this.enabled) return;

    this.reduced = prefersReducedMotion();
    this.loader = new TextureLoader();
    this.textures = new Map();

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new Scene();
    this.camera = new OrthographicCamera(); // dims reales en resize()
    this.camera.position.z = 10;

    this.material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      uniforms: {
        uTexture: { value: null },
        uVelocity: { value: new Vector2(0, 0) },
        uHover: { value: 0 },
        uHasTex: { value: 0 },
      },
    });
    this.mesh = new Mesh(new PlaneGeometry(1, 1), this.material);
    this.scene.add(this.mesh);

    // Estado de seguimiento del puntero.
    this.pointer = new Vector2(window.innerWidth / 2, window.innerHeight / 2);
    this.prevPointer = this.pointer.clone();
    this.pos = this.pointer.clone(); // posición (con lag) del plano
    this.vel = new Vector2(0, 0);
    this.active = false;
    this.hover = 0;
    this._cleared = false;

    this._bind();
    this.resize();
  }

  _bind() {
    this._onMove = (e) => {
      this.pointer.set(e.clientX, e.clientY);
    };
    window.addEventListener('pointermove', this._onMove, { passive: true });

    this.rows.forEach((row) => {
      row.addEventListener('pointerenter', () => {
        this._setTexture(row.dataset.img);
        this.active = true;
      });
      row.addEventListener('pointerleave', () => {
        this.active = false;
      });
    });
  }

  _setTexture(url) {
    if (!url) return;
    const assign = (tex) => {
      this.material.uniforms.uTexture.value = tex;
      this.material.uniforms.uHasTex.value = 1;
    };
    if (this.textures.has(url)) {
      assign(this.textures.get(url));
      return;
    }
    this.loader.load(url, (tex) => {
      tex.minFilter = LinearFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = SRGBColorSpace;
      this.textures.set(url, tex);
      assign(tex);
    });
  }

  resize() {
    if (!this.enabled) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);

    // Ortho centrada en píxeles.
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.near = -100;
    this.camera.far = 100;
    this.camera.updateProjectionMatrix();

    // Tamaño del plano (3:2), responsive.
    this.planeW = clamp(w * 0.3, 300, 460);
    this.planeH = this.planeW * (2 / 3);
  }

  update(dt) {
    if (!this.enabled) return;

    // Velocidad = desplazamiento del puntero por frame, normalizado.
    const vx = (this.pointer.x - this.prevPointer.x) / 70;
    const vy = (this.pointer.y - this.prevPointer.y) / 70;
    this.prevPointer.copy(this.pointer);

    const targetVel = this.reduced ? 0 : 1;
    this.vel.x = damp(this.vel.x, vx * targetVel, 0.001, dt);
    this.vel.y = damp(this.vel.y, vy * targetVel, 0.001, dt);
    // Clamp para que un movimiento brusco no rompa la imagen.
    this.vel.x = clamp(this.vel.x, -2, 2);
    this.vel.y = clamp(this.vel.y, -2, 2);
    this.material.uniforms.uVelocity.value.copy(this.vel);

    // Fade in/out del hover.
    this.hover = damp(this.hover, this.active ? 1 : 0, 0.0008, dt);
    this.material.uniforms.uHover.value = this.hover;

    // Posición del plano con lag.
    this.pos.x = damp(this.pos.x, this.pointer.x, 0.002, dt);
    this.pos.y = damp(this.pos.y, this.pointer.y, 0.002, dt);
    // De coords de pantalla a ortho centrada (y invertida).
    this.mesh.position.x = this.pos.x - window.innerWidth / 2;
    this.mesh.position.y = -(this.pos.y - window.innerHeight / 2);

    // Escala del plano (crece al aparecer).
    const s = 0.88 + 0.12 * this.hover;
    this.mesh.scale.set(this.planeW * s, this.planeH * s, 1);

    // Render solo mientras sea visible; si no, limpiamos una vez y salimos.
    const visible = this.hover > 0.001;
    this.mesh.visible = visible;
    if (!visible) {
      if (!this._cleared) {
        this.renderer.clear();
        this._cleared = true;
      }
      return;
    }
    this._cleared = false;
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (!this.enabled) return;
    window.removeEventListener('pointermove', this._onMove);
    this.textures.forEach((t) => t.dispose());
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
