/**
 * i18n mínimo y sin dependencias. Traduce todo nodo con [data-i18n]="clave"
 * reemplazando su textContent. Persiste el idioma en localStorage y actualiza
 * <html lang>. El botón [data-lang-toggle] muestra SIEMPRE el idioma al que
 * saltarías (si estás en ES, dice "EN").
 *
 * Orden de uso (ver App): applyInitial() ANTES de que Reveal parta el texto,
 * para que el split se arme sobre el idioma correcto. Los cambios posteriores
 * disparan onApply() para que Reveal vuelva a partir las líneas afectadas.
 */
const DICT = {
  es: {
    'nav.work': 'Trabajo',
    'nav.services': 'Qué hago',
    'nav.studio': 'Sobre mí',
    'nav.journal': 'Bitácora',
    'nav.cta': 'Hablemos',
    'hero.eyebrow': 'AI Engineer & Backend Dev — Argentina',
    'hero.l1': 'Transformo ideas',
    'hero.l2': 'en productos',
    'hero.l3': 'reales.',
    'hero.sub':
      'Construyo cosas que de verdad sirven, con arquitecturas muy estudiadas. Y documento el proceso.',
    'hero.link': 'Proyectos',
    'studio.index': '(01) — Sobre mí',
    'studio.text':
      'No construyo demos. Construyo sistemas vivos: productos que creé desde cero, con decisiones de arquitectura pensadas a fondo. Y voy dejando registro de cómo los hago.',
    'work.index': '(02) — Proyectos',
    'work.title': 'Cosas que construí',
    'p1.tag': 'SaaS multi-tenant · Spring Boot',
    'p2.tag': 'Full-stack · Vista 3D',
    'p3.tag': 'IA local · Tooling',
    'services.index': '(03) — Qué hago',
    'services.title': 'Capacidades',
    'svc1.title': 'Backend & arquitectura',
    'svc1.desc': 'APIs, multi-tenancy, pagos y datos. Pensado para escalar.',
    'svc2.title': 'IA aplicada',
    'svc2.desc': 'LLMs, visión y modelos locales dentro de productos reales.',
    'svc3.title': 'Creative dev',
    'svc3.desc': 'WebGL, shaders y motion cuando el producto lo pide.',
    'svc4.title': 'Producto end-to-end',
    'svc4.desc': 'De la idea al deploy: diseño, build y puesta en producción.',
    'num1.label': 'productos propios',
    'num2.label': 'stacks principales',
    'num3.label': '% construido por mí',
    'journal.index': '(04) — Bitácora',
    'journal.title': 'Lo que voy aprendiendo',
    'journal.lead': 'Notas de lo que construyo. La versión larga vive en LinkedIn.',
    'footer.index': '(05) — Contacto',
    'footer.l1': 'Tenés una idea.',
    'footer.l2': 'Hagámosla real.',
    'footer.place': 'Argentina — remoto',
  },
  en: {
    'nav.work': 'Work',
    'nav.services': 'What I do',
    'nav.studio': 'About',
    'nav.journal': 'Journal',
    'nav.cta': "Let's talk",
    'hero.eyebrow': 'AI Engineer & Backend Dev — Argentina',
    'hero.l1': 'I turn ideas',
    'hero.l2': 'into real',
    'hero.l3': 'products.',
    'hero.sub':
      'I build things that are actually useful, with carefully-studied architectures. And I document the process.',
    'hero.link': 'Projects',
    'studio.index': '(01) — About',
    'studio.text':
      "I don't build demos. I build living systems: products I made from scratch, with architecture decisions thought through to the end. And I keep a record of how I do it.",
    'work.index': '(02) — Work',
    'work.title': 'Things I built',
    'p1.tag': 'Multi-tenant SaaS · Spring Boot',
    'p2.tag': 'Full-stack · 3D preview',
    'p3.tag': 'Local AI · Tooling',
    'services.index': '(03) — What I do',
    'services.title': 'Capabilities',
    'svc1.title': 'Backend & architecture',
    'svc1.desc': 'APIs, multi-tenancy, payments and data. Built to scale.',
    'svc2.title': 'Applied AI',
    'svc2.desc': 'LLMs, vision and local models inside real products.',
    'svc3.title': 'Creative dev',
    'svc3.desc': 'WebGL, shaders and motion when the product calls for it.',
    'svc4.title': 'End-to-end product',
    'svc4.desc': 'From idea to deploy: design, build and shipping.',
    'num1.label': 'own products',
    'num2.label': 'core stacks',
    'num3.label': '% built by me',
    'journal.index': '(04) — Journal',
    'journal.title': 'What I’m learning',
    'journal.lead': 'Notes on what I build. The long version lives on LinkedIn.',
    'footer.index': '(05) — Contact',
    'footer.l1': 'Got an idea?',
    'footer.l2': "Let's make it real.",
    'footer.place': 'Argentina — remote',
  },
};

export default class I18n {
  constructor({ onApply } = {}) {
    this.onApply = onApply;
    this.lang = localStorage.getItem('lang') || 'es';
    this.btn = document.querySelector('[data-lang-toggle]');
    if (this.btn) {
      this.btn.addEventListener('click', () =>
        this.set(this.lang === 'es' ? 'en' : 'es')
      );
    }
  }

  /**
   * Agrega traducciones en runtime (ej. las de la bitácora, generadas desde
   * datos). Llamar ANTES de applyInitial para que el primer render ya las use.
   */
  extend(extra) {
    if (!extra) return;
    for (const lang of Object.keys(extra)) {
      DICT[lang] = Object.assign(DICT[lang] || {}, extra[lang]);
    }
  }

  /** Aplicación inicial: sin refresh (Reveal todavía no partió el texto). */
  applyInitial() {
    this._apply(false);
  }

  set(lang) {
    if (lang === this.lang) return;
    this.lang = lang;
    try {
      localStorage.setItem('lang', lang);
    } catch (_) {}
    this._apply(true);
  }

  _apply(refresh) {
    const dict = DICT[this.lang] || DICT.es;
    document.documentElement.lang = this.lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = dict[el.dataset.i18n];
      if (val != null) el.textContent = val;
    });
    if (this.btn) this.btn.textContent = this.lang === 'es' ? 'EN' : 'ES';
    if (refresh && this.onApply) this.onApply();
  }
}
