import { gsap } from 'gsap';

/**
 * Preloader con contador + barra. Resuelve una promesa cuando termina
 * la animación de salida, para que App dispare la intro del hero después.
 * Simula progreso con un tween; en producción atá `progress` a la carga
 * real de assets (texturas, modelos, fuentes).
 */
export default class Preloader {
  constructor() {
    this.el = document.querySelector('[data-preloader]');
    this.count = this.el.querySelector('[data-preloader-count]');
    this.bar = this.el.querySelector('[data-preloader-bar]');
  }

  play() {
    return new Promise((resolve) => {
      const state = { v: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => {
          this.el.style.display = 'none';
          resolve();
        },
      });

      tl.to(state, {
        v: 100,
        duration: 1.6,
        ease: 'power1.inOut',
        onUpdate: () => {
          const n = Math.round(state.v);
          this.count.textContent = n;
          this.bar.style.transform = `scaleX(${state.v / 100})`;
        },
      })
        .to('.preloader__inner', { opacity: 0, y: -20, duration: 0.5 }, '+=0.15')
        .to(this.el, { yPercent: -100, duration: 0.9, ease: 'power3.inOut' }, '-=0.1');
    });
  }
}
