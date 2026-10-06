import { damp } from '../utils/math.js';

/**
 * Cursor custom con dos capas: punto que sigue 1:1 y anillo con lag (lerp).
 * Se agranda sobre elementos [data-cursor-hover].
 * No se instancia en dispositivos táctiles (lo oculta el CSS; acá salimos).
 */
export default class Cursor {
  constructor() {
    this.el = document.querySelector('[data-cursor]');
    this.supportsHover = window.matchMedia('(hover: hover)').matches;
    if (!this.el || !this.supportsHover) {
      this.enabled = false;
      return;
    }
    this.enabled = true;

    this.dot = this.el.querySelector('.cursor__dot');
    this.ring = this.el.querySelector('.cursor__ring');

    this.mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    this.ringPos = { ...this.mouse };

    this._onMove = (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      // El punto es inmediato (translate directo).
      this.dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    };
    window.addEventListener('pointermove', this._onMove, { passive: true });

    this._bindHovers();
  }

  _bindHovers() {
    document.querySelectorAll('[data-cursor-hover]').forEach((node) => {
      node.addEventListener('pointerenter', () => this.el.classList.add('is-hover'));
      node.addEventListener('pointerleave', () => this.el.classList.remove('is-hover'));
    });
  }

  update(dt) {
    if (!this.enabled) return;
    this.ringPos.x = damp(this.ringPos.x, this.mouse.x, 0.0005, dt);
    this.ringPos.y = damp(this.ringPos.y, this.mouse.y, 0.0005, dt);
    this.ring.style.transform = `translate(${this.ringPos.x}px, ${this.ringPos.y}px) translate(-50%,-50%)`;
  }

  destroy() {
    if (this.enabled) window.removeEventListener('pointermove', this._onMove);
  }
}
