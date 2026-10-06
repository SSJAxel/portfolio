/**
 * Detecta la sección activa y reporta su color (`data-tint`) al callback.
 *
 * El root del IntersectionObserver se reduce a una línea en el centro del
 * viewport (`rootMargin: -50% 0 -50% 0`), así una sección se considera activa
 * justo cuando su centro cruza el centro de pantalla — una a la vez. Funciona
 * con Lenis porque Lenis hace scroll real de la ventana (no transform).
 */
export default class SectionTint {
  constructor(onChange) {
    this.onChange = onChange;
    this.sections = Array.from(document.querySelectorAll('[data-tint]'));
    if (!this.sections.length) return;

    this.io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.dataset.tint) {
            this.onChange(entry.target.dataset.tint);
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );
    this.sections.forEach((s) => this.io.observe(s));
  }

  destroy() {
    if (this.io) this.io.disconnect();
  }
}
