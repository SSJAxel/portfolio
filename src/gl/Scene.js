import {
  Scene as ThreeScene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  ColorManagement,
  Layers,
  Vector2,
  ShaderMaterial,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import Background from './Background.js';
import HeroObject from './HeroObject.js';
import { isLowPower } from '../utils/math.js';

// Shader estilizado: desactivamos la gestión de color para que los
// valores sRGB que mezclamos salgan WYSIWYG, sin conversión a lineal.
ColorManagement.enabled = false;

// Canal de capa reservado para lo que debe emitir bloom.
const BLOOM_LAYER = 1;

/**
 * Capa WebGL. Posee el renderer, la escena y los componentes GL.
 *
 * Render en dos pasadas (bloom selectivo):
 *   1) cámara mirando SOLO la capa de bloom (el blob) sobre fondo negro ->
 *      bloomComposer produce la textura de glow (el papel claro no aparece,
 *      así que no florece).
 *   2) cámara normal -> escena completa + un mix pass que le SUMA el glow.
 */
export default class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new ThreeScene();

    this.camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.z = 5.0;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.paper = 0xeeeae0;
    this.renderer.setClearColor(this.paper, 1);

    this.clock = new Clock();
    this.dpr = 1;

    // En mobile: sin bloom (caro y casi no se nota) y DPR más capeado.
    this.lowPower = isLowPower();
    this.useBloom = !this.lowPower;

    this.background = new Background();
    this.background.addTo(this.scene);

    this.hero = new HeroObject();
    this.hero.addTo(this.scene);
    this.hero.mesh.layers.enable(BLOOM_LAYER); // visible en escena y en bloom

    this.bloomLayer = new Layers();
    this.bloomLayer.set(BLOOM_LAYER);

    if (this.useBloom) this._setupComposers();
    this.resize();
  }

  _setupComposers() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // MSAA en los targets intermedios: el renderer.antialias solo afecta al
    // framebuffer por defecto, no a los buffers del composer.
    const samples = 4;

    // --- Pase de bloom (no va a pantalla) ---
    this.bloomComposer = new EffectComposer(this.renderer);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new Vector2(w, h),
      0.75, // strength
      0.5, // radius
      0.55 // threshold (solo lo más brillante del blob florece)
    );
    this.bloomComposer.addPass(this.bloomPass);

    // --- Pase final: escena real + suma del glow ---
    this.finalComposer = new EffectComposer(this.renderer);
    this.finalComposer.renderTarget1.samples = samples;
    this.finalComposer.renderTarget2.samples = samples;
    this.finalComposer.addPass(new RenderPass(this.scene, this.camera));

    const mixPass = new ShaderPass(
      new ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            gl_FragColor = texture2D(baseTexture, vUv)
                         + vec4(1.0) * texture2D(bloomTexture, vUv);
          }
        `,
      }),
      'baseTexture'
    );
    mixPass.needsSwap = true;
    this.finalComposer.addPass(mixPass);
  }

  /** Entrada del objeto del hero (la dispara App tras el preloader). */
  playIntro() {
    this.hero.playIntro();
  }

  setMouse(x, y) {
    this.background.setMouse(x, y);
    this.hero.setMouse(x, y);
  }

  setScroll(progress) {
    this.background.setScroll(progress);
    this.hero.setScroll(progress);
  }

  /** Color de la sección activa -> fondo. */
  setSectionColor(color) {
    this.background.setSectionColor(color);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 2);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, true);
    if (this.useBloom) {
      this.bloomComposer.setSize(w, h);
      this.finalComposer.setSize(w, h);
    }

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.background.resize(w, h, this.dpr);

    // Ancho visible a la profundidad del objeto (z=0) -> offset proporcional.
    const dist = this.camera.position.z;
    const halfH = Math.tan((this.camera.fov * Math.PI) / 360) * dist;
    const halfW = halfH * this.camera.aspect;
    this.hero.resize(w, h, halfW);
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.elapsedTime;
    this.background.update(elapsed, dt);
    this.hero.update(elapsed, dt);

    if (!this.useBloom) {
      // Mobile: una sola pasada directa, sin composer.
      this.renderer.setClearColor(this.paper, 1);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 1) Glow: solo la capa de bloom, sobre negro.
    this.camera.layers.set(BLOOM_LAYER);
    this.renderer.setClearColor(0x000000, 1);
    this.bloomComposer.render();

    // 2) Escena completa + suma del glow.
    this.camera.layers.set(0);
    this.renderer.setClearColor(this.paper, 1);
    this.finalComposer.render();
  }

  dispose() {
    this.background.dispose();
    this.hero.dispose();
    if (this.useBloom) {
      this.bloomComposer.dispose();
      this.finalComposer.dispose();
    }
    this.renderer.dispose();
  }
}
