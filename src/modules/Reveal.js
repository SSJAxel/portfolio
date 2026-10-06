import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../utils/math.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Orquesta las animaciones de entrada:
 *  - [data-split]        -> mask reveal (sube desde un .line con overflow:hidden).
 *  - [data-split-lines]  -> split por palabras + stagger al hacer scroll.
 *  - [data-reveal]       -> fade + translateY al entrar en viewport.
 *  - [data-count]        -> conteo numérico al entrar en viewport.
 *
 * Split por palabras propio, para no depender del plugin SplitText (de pago).
 * `rebuildSplitLines()` permite re-partir tras un cambio de idioma (i18n).
 */
export default class Reveal {
  constructor() {
    this.reduced = prefersReducedMotion();
    this._lineTriggers = [];
    this._splitWords();
  }

  /** Divide cada [data-split-lines] en palabras envueltas en .word */
  _splitWords() {
    document.querySelectorAll('[data-split-lines]').forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((w, i) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = w;
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
    });
  }

  /** Crea (y registra) los triggers de stagger de palabras. */
  _buildLineTriggers() {
    if (this.reduced) return;
    gsap.utils.toArray('[data-split-lines]').forEach((el) => {
      const tw = gsap.to(el.querySelectorAll('.word'), {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.025,
        scrollTrigger: { trigger: el, start: 'top 82%' },
      });
      if (tw.scrollTrigger) this._lineTriggers.push(tw.scrollTrigger);
    });
  }

  /** Intro del hero. Devuelve el timeline (App lo encadena tras el preloader). */
  intro() {
    if (this.reduced) return gsap.timeline();
    return gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .to('.hero [data-split]', { yPercent: 0, duration: 1.1, stagger: 0.09 })
      .to(
        '.hero [data-reveal]',
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 },
        '-=0.7'
      );
  }

  /** Reveals disparados por scroll para el resto de la página. */
  initScroll() {
    if (this.reduced) return;

    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    this._buildLineTriggers();

    // Mask reveals fuera del hero (footer CTA).
    gsap.utils.toArray('[data-split]').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.to(el, {
        yPercent: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    // Count-up de los números.
    gsap.utils.toArray('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count) || 0;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: () => {
          el.textContent = Math.round(obj.v);
        },
      });
    });

    ScrollTrigger.refresh();
  }

  /**
   * Re-parte las líneas tras un cambio de idioma: mata los triggers viejos
   * (sus nodos .word ya no existen), vuelve a partir el texto nuevo y crea
   * triggers frescos — así una sección que todavía no entró en viewport sigue
   * esperando el scroll en vez de aparecer de golpe.
   */
  rebuildSplitLines() {
    this._lineTriggers.forEach((t) => t.kill());
    this._lineTriggers = [];
    this._splitWords();
    this._buildLineTriggers();
    ScrollTrigger.refresh();
  }
}
