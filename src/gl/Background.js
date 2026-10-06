import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
  Color,
} from 'three';

import vertexShader from './shaders/background.vert?raw';
import fragmentShader from './shaders/background.frag?raw';
import { damp, prefersReducedMotion } from '../utils/math.js';

/**
 * Plano fullscreen cuyo fragment shader dibuja el fondo animado.
 * El vertex escribe gl_Position en clip-space directamente,
 * así que la cámara es irrelevante: un PlaneGeometry(2,2) cubre la pantalla.
 */
export default class Background {
  constructor() {
    this.mouse = new Vector2(0.5, 0.5);
    this.mouseTarget = new Vector2(0.5, 0.5);
    this.scroll = 0;

    const intensity = prefersReducedMotion() ? 0 : 1;

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
        uMouse: { value: this.mouse },
        uScroll: { value: 0 },
        uIntensity: { value: intensity },
        // Paleta clara: swap estos 3 colores y cambia todo el mood.
        // (ColorManagement off en Scene -> valores sRGB tal cual.)
        uColorA: { value: new Color('#eeeae0') }, // paper (bone)
        uColorB: { value: new Color('#dcd6ff') }, // tinte lavanda suave
        uColorC: { value: new Color('#2e2bff') }, // acento eléctrico (por sección)
        uTint: { value: new Color('#2e2bff') }, // neblina por sección
      },
    });

    // Color objetivo de la sección activa; uColorC/uTint lo persiguen suave.
    this.targetColor = new Color('#2e2bff');

    this.mesh = new Mesh(new PlaneGeometry(2, 2), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1; // siempre detrás del objeto 3D del hero
  }

  /** @param {THREE.Scene} scene */
  addTo(scene) {
    scene.add(this.mesh);
  }

  setMouse(x, y) {
    // y invertido: en el shader 0 es abajo.
    this.mouseTarget.set(x, 1 - y);
  }

  setScroll(progress) {
    this.scroll = progress;
  }

  /** Color de la sección activa (hex o THREE.Color). */
  setSectionColor(color) {
    this.targetColor.set(color);
  }

  resize(width, height, dpr) {
    this.material.uniforms.uResolution.value.set(width * dpr, height * dpr);
  }

  update(elapsed, dt) {
    // Suavizado del puntero, independiente del framerate.
    this.mouse.x = damp(this.mouse.x, this.mouseTarget.x, 0.0001, dt);
    this.mouse.y = damp(this.mouse.y, this.mouseTarget.y, 0.0001, dt);

    const u = this.material.uniforms;
    u.uTime.value = elapsed;
    u.uScroll.value = damp(u.uScroll.value, this.scroll, 0.001, dt);

    // Transición de color hacia la sección activa (~0.5s).
    const a = 1 - Math.pow(0.0006, dt);
    u.uColorC.value.lerp(this.targetColor, a);
    u.uTint.value.lerp(this.targetColor, a);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
