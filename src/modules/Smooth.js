import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../utils/math.js';

/**
 * Scroll suave (Lenis) como única fuente de verdad del scroll.
 * Patrón estándar creative-dev:
 *   - Lenis NO corre su propio RAF; lo tickea GSAP (un solo loop).
 *   - ScrollTrigger se actualiza en cada evento de scroll de Lenis.
 * En reduce-motion desactivamos la inercia y dejamos scroll nativo.
 */
export default class Smooth {
  constructor() {
    this.reduced = prefersReducedMotion();

    this.lenis = new Lenis({
      lerp: this.reduced ? 1 : 0.1,
      smoothWheel: !this.reduced,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    // 1) ScrollTrigger escucha a Lenis.
    this.lenis.on('scroll', ScrollTrigger.update);

    // 2) GSAP tickea a Lenis (ms -> s).
    this._raf = (time) => this.lenis.raf(time * 1000);
    gsap.ticker.add(this._raf);
    gsap.ticker.lagSmoothing(0);

    this.onScroll = null;
    this.lenis.on('scroll', ({ progress }) => {
      if (this.onScroll) this.onScroll(progress ?? 0);
    });
  }

  /** callback(progress 0..1) — usado para alimentar el shader. */
  bindProgress(cb) {
    this.onScroll = cb;
  }

  scrollTo(target, opts) {
    this.lenis.scrollTo(target, opts);
  }

  /** Bloquea / libera el scroll (ej. mientras hay un panel abierto). */
  stop() {
    this.lenis.stop();
  }
  start() {
    this.lenis.start();
  }

  destroy() {
    gsap.ticker.remove(this._raf);
    this.lenis.destroy();
  }
}
