import {
  Mesh,
  IcosahedronGeometry,
  ShaderMaterial,
  Color,
  Vector2,
} from 'three';

import { gsap } from 'gsap';
import vertexShader from './shaders/hero.vert?raw';
import fragmentShader from './shaders/hero.frag?raw';
import { damp, clamp, prefersReducedMotion, isLowPower } from '../utils/math.js';

/**
 * El "organismo" del hero: una icoesfera de alto detalle deformada por ruido
 * 3D en el vertex shader. Respira (uTime), reacciona al puntero (rotación con
 * lerp) y se desvanece al salir del hero (según el progreso de scroll) para no
 * quedar flotando detrás del resto de la página.
 */
export default class HeroObject {
  constructor() {
    const intensity = prefersReducedMotion() ? 0.12 : 1;

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.3 },
        uFreq: { value: 1.15 },
        uIntensity: { value: intensity },
        uOpacity: { value: 1 },
        // Colores (ColorManagement off -> sRGB tal cual).
        uColorBase: { value: new Color('#1b18e0') }, // índigo profundo
        uColorAlt: { value: new Color('#ff5a3c') }, // coral (iridiscencia)
        uColorRim: { value: new Color('#9fb4ff') }, // borde claro
      },
    });

    // Menos subdivisión en mobile: ~4x menos triángulos, igual se ve suave.
    const detail = isLowPower() ? 10 : 20;
    this.mesh = new Mesh(new IcosahedronGeometry(1, detail), this.material);
    this.mesh.position.y = 0.25;
    this.mesh.scale.setScalar(1.15);

    this.mouse = new Vector2(0, 0);
    this.mouseTarget = new Vector2(0, 0);
    this.scroll = 0;
    this.baseScale = 1.15;

    // Entrada: factor de escala 0..1 y giro extra que decae. Arranca en 1
    // (lleno, pero oculto tras el preloader); playIntro lo anima 0 -> 1.
    this.intro = 1;
    this.introSpin = 0;
    this.reduced = prefersReducedMotion();
  }

  /** Dispara la entrada del objeto (al levantarse el preloader). */
  playIntro() {
    if (this.reduced) return;
    gsap.fromTo(this, { intro: 0 }, { intro: 1, duration: 1.5, ease: 'back.out(1.5)' });
    gsap.fromTo(this, { introSpin: Math.PI * 1.4 }, { introSpin: 0, duration: 1.9, ease: 'power3.out' });
    gsap.fromTo(
      this.material.uniforms.uAmp,
      { value: 0.55 },
      { value: 0.3, duration: 1.9, ease: 'power2.out' }
    );
  }

  addTo(scene) {
    scene.add(this.mesh);
  }

  /** @param {number} x @param {number} y en rango 0..1 (coords de pantalla). */
  setMouse(x, y) {
    this.mouseTarget.set((x - 0.5) * 2.0, (y - 0.5) * 2.0);
  }

  setScroll(progress) {
    this.scroll = progress;
  }

  /**
   * Posiciona el objeto según el viewport. `halfW` es la mitad del ancho
   * visible a la profundidad del objeto (la calcula Scene desde la cámara),
   * así el offset a la derecha es proporcional y nunca se va de pantalla.
   */
  resize(w, _h, halfW) {
    const portrait = w < 760;
    if (portrait) {
      // En mobile el texto se apila: dejamos el blob arriba y centrado.
      this.mesh.position.x = 0;
      this.mesh.position.y = 1.0;
      this.baseScale = 0.9;
    } else {
      // Desktop: mitad derecha del hero.
      this.mesh.position.x = halfW * 0.5;
      this.mesh.position.y = 0.25;
      this.baseScale = 1.15;
    }
  }

  update(elapsed, dt) {
    this.material.uniforms.uTime.value = elapsed;

    this.mouse.x = damp(this.mouse.x, this.mouseTarget.x, 0.0015, dt);
    this.mouse.y = damp(this.mouse.y, this.mouseTarget.y, 0.0015, dt);

    // Giro lento + inclinación según el puntero + giro de entrada.
    this.mesh.rotation.y = elapsed * 0.14 + this.mouse.x * 0.6 + this.introSpin;
    this.mesh.rotation.x = this.mouse.y * 0.45;

    // Visible solo en el hero: se apaga en el primer ~14% del scroll.
    const vis = 1.0 - clamp(this.scroll / 0.14, 0, 1);
    const u = this.material.uniforms.uOpacity;
    u.value = damp(u.value, vis, 0.001, dt);

    // Escala = base · respiración por scroll · factor de entrada.
    this.mesh.scale.setScalar(this.baseScale * (0.9 + 0.1 * vis) * this.intro);
    this.mesh.visible = u.value > 0.01 && this.intro > 0.001;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
