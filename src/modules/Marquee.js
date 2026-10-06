import { gsap } from 'gsap';
import { prefersReducedMotion } from '../utils/math.js';

/**
 * Marquee infinito y fluido. Duplica el contenido para tener un loop sin
 * costuras y lo mueve con un tween lineal repetido (-50% = un set completo).
 */
export default class Marquee {
  constructor() {
    this.track = document.querySelector('[data-marquee]');
    if (!this.track || prefersReducedMotion()) return;

    // Duplicamos el set para cubrir el hueco al reciclar.
    this.track.innerHTML += this.track.innerHTML;

    this.tween = gsap.to(this.track, {
      xPercent: -50,
      ease: 'none',
      duration: 22,
      repeat: -1,
    });

    // Sutil: acelera/desacelera según el scroll (sensación de "vivo").
    this._onWheel = () => {
      gsap.to(this.tween, {
        timeScale: 2.2,
        duration: 0.3,
        overwrite: true,
        onComplete: () =>
          gsap.to(this.tween, { timeScale: 1, duration: 0.8 }),
      });
    };
    window.addEventListener('wheel', this._onWheel, { passive: true });
  }

  destroy() {
    if (this.tween) this.tween.kill();
    window.removeEventListener('wheel', this._onWheel);
  }
}
