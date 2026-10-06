import { gsap } from 'gsap';

/**
 * Panel de detalle de proyecto que se desliza desde la derecha.
 *
 * Data-driven y bilingüe: editá PROJECTS. Se abre al click (o Enter/Espacio)
 * en una fila [data-project]; bloquea el scroll mientras está abierto (callbacks
 * lock/unlock que App conecta a Lenis), cierra con botón, backdrop o Esc, y
 * maneja foco para accesibilidad.
 *
 * Verificá/reemplazá las URLs de `links` — las dejé con lo que sé a mano.
 */
const PROJECTS = {
  capibooking: {
    name: 'capibooking',
    year: '2026',
    cat: { es: 'SaaS multi-tenant', en: 'Multi-tenant SaaS' },
    img: '/img/capibooking.svg',
    summary: {
      es: 'Plataforma de reservas multi-tenant para estudios y comercios, pensada como producto, no como un CRUD de tutorial.',
      en: 'Multi-tenant booking platform for studios and small businesses, built as a product — not a tutorial CRUD.',
    },
    decisions: {
      es: [
        'Multi-tenancy shared-DB con tenant_id + Hibernate @TenantId: aislamiento por cliente sin una base de datos por tenant.',
        'Garantía anti doble-reserva con constraint EXCLUDE de Postgres, no con lógica de aplicación.',
        'Pagos y señas con MercadoPago (Checkout Pro + suscripciones), verificado contra el sandbox real.',
      ],
      en: [
        'Shared-DB multi-tenancy with tenant_id + Hibernate @TenantId: per-client isolation without one database per tenant.',
        'Double-booking guarantee via a Postgres EXCLUDE constraint, not app logic.',
        'Payments and deposits with MercadoPago (Checkout Pro + subscriptions), verified against the real sandbox.',
      ],
    },
    stack: ['Java', 'Spring Boot 4', 'PostgreSQL', 'Hibernate', 'MercadoPago', 'React', 'Render'],
    links: [{ label: { es: 'Demo', en: 'Live' }, url: 'https://capibooking.onrender.com' }],
  },

  capicotizador: {
    name: 'capicotizador',
    year: '2026',
    cat: { es: 'Full-stack · 3D', en: 'Full-stack · 3D' },
    img: '/img/capicotizador.svg',
    summary: {
      es: 'Cotizador de tatuajes con motor de precios configurable por artista y un preview 3D del diseño sobre el cuerpo.',
      en: 'Tattoo quoting tool with a per-artist pricing engine and a 3D preview of the design on the body.',
    },
    decisions: {
      es: [
        'Motor de precio por tenant con 28 zonas y 18 técnicas configurables.',
        'Preview 3D con React Three Fiber + MakeHuman, con decals del diseño sobre el cuerpo.',
        'Privacidad por diseño: endpoint /options (público, sin precios) separado de /config (precios internos), con auth JWT por tenant.',
      ],
      en: [
        'Per-tenant pricing engine with 28 configurable body zones and 18 techniques.',
        '3D preview with React Three Fiber + MakeHuman, projecting the design as decals on the body.',
        'Privacy by design: a public /options endpoint (no prices) split from /config (internal pricing), with per-tenant JWT auth.',
      ],
    },
    stack: ['Node', 'Express', 'TypeScript', 'React', 'Three.js / R3F', 'Prisma', 'PostgreSQL'],
    links: [],
  },

  'ai-site-auditor': {
    name: 'ai-site-auditor',
    year: '2026',
    cat: { es: 'IA local · Tooling', en: 'Local AI · Tooling' },
    img: '/img/ai-site-auditor.svg',
    summary: {
      es: 'Auditoría de sitios que combina las métricas de Lighthouse con el análisis de un LLM que corre en tu propia máquina.',
      en: 'Site auditing that pairs Lighthouse metrics with analysis from an LLM running on your own machine.',
    },
    decisions: {
      es: [
        'IA 100% local con Ollama: privacidad total, sin costo por token y sin mandar nada a la nube.',
        'Lighthouse headless como fuente de métricas objetivas y reproducibles.',
        'Pipeline que cruza métricas y las convierte en sugerencias priorizadas por la IA.',
      ],
      en: [
        'Fully local AI with Ollama: full privacy, no per-token cost, nothing sent to the cloud.',
        'Headless Lighthouse as the source of objective, reproducible metrics.',
        'A pipeline that cross-references metrics and turns them into AI-prioritized suggestions.',
      ],
    },
    stack: ['Node', 'TypeScript', 'Lighthouse', 'Ollama', 'React'],
    links: [],
  },
};

const T = {
  es: { decisions: 'Decisiones clave', stack: 'Stack', close: 'Cerrar', priv: 'Repo privado' },
  en: { decisions: 'Key decisions', stack: 'Stack', close: 'Close', priv: 'Private repo' },
};

export default class ProjectDetail {
  constructor({ lang = 'es', lock, unlock } = {}) {
    this.lang = lang;
    this.lock = lock || (() => {});
    this.unlock = unlock || (() => {});
    this.open = false;
    this.currentSlug = null;
    this.lastFocus = null;

    this._buildShell();
    this._bindTriggers();
  }

  _buildShell() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'detail-backdrop';

    this.panel = document.createElement('aside');
    this.panel.className = 'detail-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.setAttribute('aria-hidden', 'true');
    this.panel.tabIndex = -1;

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.panel);

    this.backdrop.addEventListener('click', () => this.close());
    this._onKey = (e) => {
      if (e.key === 'Escape' && this.open) this.close();
    };
    window.addEventListener('keydown', this._onKey);
  }

  _bindTriggers() {
    document.querySelectorAll('[data-project]').forEach((row) => {
      const slug = row.dataset.project;
      row.addEventListener('click', () => this.show(slug));
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.show(slug);
        }
      });
    });
  }

  _render(slug) {
    const p = PROJECTS[slug];
    if (!p) return;
    const L = this.lang;
    const t = T[L] || T.es;

    const decisions = p.decisions[L].map((d) => `<li>${d}</li>`).join('');
    const stack = p.stack.map((s) => `<span class="detail__tag">${s}</span>`).join('');
    const links = p.links.length
      ? p.links
          .map(
            (l) =>
              `<a class="detail__link" href="${l.url}" target="_blank" rel="noopener" data-cursor-hover>${l.label[L]} ↗</a>`
          )
          .join('')
      : `<span class="detail__priv">${t.priv}</span>`;

    this.panel.innerHTML = `
      <button class="detail__close" data-detail-close aria-label="${t.close}">
        <span></span><span></span>
      </button>
      <div class="detail__scroll">
        <div class="detail__media" style="background-image:url(${p.img})"></div>
        <div class="detail__head">
          <span class="detail__meta">${p.cat[L]} · ${p.year}</span>
          <h2 class="detail__name">${p.name}</h2>
        </div>
        <p class="detail__summary">${p.summary[L]}</p>
        <h3 class="detail__label">${t.decisions}</h3>
        <ul class="detail__decisions">${decisions}</ul>
        <h3 class="detail__label">${t.stack}</h3>
        <div class="detail__stack">${stack}</div>
        <div class="detail__links">${links}</div>
      </div>
    `;

    this.panel
      .querySelector('[data-detail-close]')
      .addEventListener('click', () => this.close());
  }

  show(slug) {
    if (!PROJECTS[slug]) return;
    this.currentSlug = slug;
    this.lastFocus = document.activeElement;
    this._render(slug);

    this.open = true;
    this.panel.setAttribute('aria-hidden', 'false');
    this.lock();

    gsap.killTweensOf([this.panel, this.backdrop]);
    gsap.set(this.backdrop, { display: 'block' });
    gsap.to(this.backdrop, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(
      this.panel,
      { xPercent: 100 },
      {
        xPercent: 0,
        duration: 0.6,
        ease: 'power3.out',
        onComplete: () => this.panel.focus(),
      }
    );
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.panel.setAttribute('aria-hidden', 'true');

    gsap.killTweensOf([this.panel, this.backdrop]);
    gsap.to(this.backdrop, { opacity: 0, duration: 0.4, ease: 'power2.in' });
    gsap.to(this.panel, {
      xPercent: 100,
      duration: 0.5,
      ease: 'power3.in',
      onComplete: () => {
        gsap.set(this.backdrop, { display: 'none' });
        this.unlock();
        if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
      },
    });
  }

  /** Re-render en el idioma nuevo si el panel está abierto (lo llama App). */
  setLang(lang) {
    this.lang = lang;
    if (this.open && this.currentSlug) this._render(this.currentSlug);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey);
    this.backdrop.remove();
    this.panel.remove();
  }
}
