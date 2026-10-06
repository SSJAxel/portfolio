/**
 * Bitácora: lista de entradas de aprendizaje (tu vidriera, enlazada a LinkedIn).
 *
 * Es data-driven: editá el array ENTRIES y listo. Cada entrada se renderiza en
 * [data-journal] y registra sus traducciones (título/extracto) en i18n mediante
 * claves generadas (`journal.<i>.title` / `.excerpt`), así el toggle ES/EN las
 * cambia igual que al resto del texto, sin re-render.
 *
 * `url` apunta por ahora a tu LinkedIn — reemplazá cada una por el post real.
 */
const LINKEDIN = 'https://www.linkedin.com/in/chavezaxelsantiago/';

const ENTRIES = [
  {
    date: '2026 · 10',
    cat: 'IA local',
    url: LINKEDIN,
    title: {
      es: 'Auditar sitios con IA que corre en tu máquina',
      en: 'Auditing sites with AI that runs on your machine',
    },
    excerpt: {
      es: 'Mejorando ai-site-auditor: Lighthouse + un LLM local con Ollama, sin mandar datos afuera.',
      en: 'Improving ai-site-auditor: Lighthouse + a local LLM via Ollama, no data leaving the box.',
    },
  },
  {
    date: '2026 · 09',
    cat: 'Backend',
    url: LINKEDIN,
    title: {
      es: 'Migrar a Spring Boot 4 sin romper todo',
      en: 'Migrating to Spring Boot 4 without breaking everything',
    },
    excerpt: {
      es: 'Lo que aprendí portando capibooking: Jackson 3, autoconfig movida de paquete y los sustos del camino.',
      en: 'What I learned porting capibooking: Jackson 3, relocated autoconfig and the scares along the way.',
    },
  },
  {
    date: '2026 · 09',
    cat: 'IA / 3D',
    url: LINKEDIN,
    title: {
      es: 'Vista 3D de tatuajes con React Three Fiber',
      en: 'A 3D tattoo preview with React Three Fiber',
    },
    excerpt: {
      es: 'Cómo armé el preview 3D de capicotizador con MakeHuman y decals sobre el cuerpo.',
      en: 'How I built capicotizador’s 3D preview with MakeHuman and decals on the body.',
    },
  },
  {
    date: '2026 · 08',
    cat: 'Arquitectura',
    url: LINKEDIN,
    title: {
      es: 'Multi-tenancy real: un tenant, una sesión',
      en: 'Real multi-tenancy: one tenant, one session',
    },
    excerpt: {
      es: 'El gotcha de Hibernate @TenantId que me costó un día entero, y cómo terminé resolviéndolo.',
      en: 'The Hibernate @TenantId gotcha that cost me a full day, and how I finally solved it.',
    },
  },
];

export default class Journal {
  constructor() {
    this.root = document.querySelector('[data-journal]');
    this.translations = { es: {}, en: {} };
    if (this.root) this._build();
  }

  _build() {
    const frag = document.createDocumentFragment();

    ENTRIES.forEach((entry, i) => {
      const titleKey = `journal.${i}.title`;
      const excerptKey = `journal.${i}.excerpt`;
      this.translations.es[titleKey] = entry.title.es;
      this.translations.en[titleKey] = entry.title.en;
      this.translations.es[excerptKey] = entry.excerpt.es;
      this.translations.en[excerptKey] = entry.excerpt.en;

      const a = document.createElement('a');
      a.className = 'log';
      a.href = entry.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('data-reveal', '');
      a.setAttribute('data-cursor-hover', '');

      a.innerHTML = `
        <span class="log__date">${entry.date}</span>
        <div class="log__body">
          <span class="log__cat">${entry.cat}</span>
          <h3 class="log__title" data-i18n="${titleKey}">${entry.title.es}</h3>
          <p class="log__excerpt" data-i18n="${excerptKey}">${entry.excerpt.es}</p>
        </div>
        <span class="log__arrow" aria-hidden="true">↗</span>
      `;
      frag.appendChild(a);
    });

    this.root.appendChild(frag);
  }

  destroy() {}
}
