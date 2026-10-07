/**
 * Menú mobile (overlay) accionado por el burger. En desktop el nav muestra los
 * links; en mobile se ocultan y quedan acá. Bloquea el scroll mientras está
 * abierto, cierra con Esc o al tocar un link, y al tocarlo hace smooth-scroll
 * a la sección (vía Lenis) en vez de un salto nativo.
 */
export default class MobileNav {
  constructor({ lock, unlock, scrollTo } = {}) {
    this.lock = lock || (() => {});
    this.unlock = unlock || (() => {});
    this.scrollTo = scrollTo || (() => {});

    this.burger = document.querySelector('[data-burger]');
    this.menu = document.querySelector('[data-mobile-menu]');
    this.links = Array.from(document.querySelectorAll('[data-menu-link]'));
    if (!this.burger || !this.menu) return;

    this.open = false;

    this.burger.addEventListener('click', () => this.toggle());
    this._onKey = (e) => {
      if (e.key === 'Escape' && this.open) this.close();
    };
    window.addEventListener('keydown', this._onKey);

    this.links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        this.close();
        // Esperamos a que arranque el cierre para que el scroll no pelee.
        setTimeout(() => this.scrollTo(target), 120);
      });
    });
  }

  toggle() {
    this.open ? this.close() : this.show();
  }

  show() {
    this.open = true;
    this.menu.classList.add('is-open');
    this.burger.classList.add('is-open');
    this.menu.setAttribute('aria-hidden', 'false');
    this.burger.setAttribute('aria-expanded', 'true');
    this.lock();
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.menu.classList.remove('is-open');
    this.burger.classList.remove('is-open');
    this.menu.setAttribute('aria-hidden', 'true');
    this.burger.setAttribute('aria-expanded', 'false');
    this.unlock();
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey);
  }
}
