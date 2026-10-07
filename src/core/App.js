import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Smooth from '../modules/Smooth.js';
import Cursor from '../modules/Cursor.js';
import Preloader from '../modules/Preloader.js';
import Reveal from '../modules/Reveal.js';
import Marquee from '../modules/Marquee.js';
import I18n from '../modules/I18n.js';
import Journal from '../modules/Journal.js';
import SectionTint from '../modules/SectionTint.js';
import ProjectDetail from '../modules/ProjectDetail.js';
import MobileNav from '../modules/MobileNav.js';
import { isLowPower } from '../utils/math.js';

/**
 * Punto de composición. No contiene lógica de bajo nivel: cablea los
 * módulos entre sí y corre UN solo loop (el ticker de GSAP) para todo.
 */
export default class App {
  constructor() {
    document.documentElement.classList.add('js-ready');

    // En mobile NO corremos WebGL: es demasiado para muchos teléfonos (el
    // navegador puede recargar la pestaña por memoria). Usamos un fondo CSS
    // liviano que igual reacciona por sección. El 3D (y Three.js, 464KB) se
    // cargan dinámicamente SOLO en desktop, así mobile ni los descarga.
    this.scene = null;
    this.hoverImage = null;
    this._booted = false;
    this.hasGL = !isLowPower();
    if (this.hasGL) this._initGL(document.querySelector('#gl'));
    else document.body.classList.add('no-gl');

    this.smooth = new Smooth();
    this.cursor = new Cursor();

    // La bitácora inyecta su DOM primero (y aporta sus traducciones), para que
    // i18n y Reveal lo vean como cualquier otro contenido estático.
    this.journal = new Journal();

    // i18n ANTES de Reveal: el idioma correcto debe estar en el DOM antes de
    // que Reveal parta el texto. Un cambio posterior re-parte las líneas.
    this.i18n = new I18n({
      onApply: () => {
        this.reveal.rebuildSplitLines();
        if (this.projectDetail) this.projectDetail.setLang(this.i18n.lang);
      },
    });
    this.i18n.extend(this.journal.translations);
    this.i18n.applyInitial();

    this.reveal = new Reveal();
    this.preloader = new Preloader();
    this.marquee = new Marquee();
    this.sectionTint = new SectionTint((color) => {
      if (this.scene) this.scene.setSectionColor(color);
      // Alimenta también el fondo CSS de mobile (var --tint).
      document.documentElement.style.setProperty('--tint', color);
    });
    this.projectDetail = new ProjectDetail({
      lang: this.i18n.lang,
      lock: () => this.smooth.stop(),
      unlock: () => this.smooth.start(),
    });
    this.mobileNav = new MobileNav({
      lock: () => this.smooth.stop(),
      unlock: () => this.smooth.start(),
      scrollTo: (target) => this.smooth.scrollTo(target),
    });

    this._bindEvents();
    this._startLoop();
    this._boot();
  }

  /** Carga WebGL bajo demanda (solo desktop). Si falla, cae a fondo CSS. */
  async _initGL(canvas) {
    try {
      const [{ default: Scene }, { default: HoverImage }] = await Promise.all([
        import('../gl/Scene.js'),
        import('../modules/HoverImage.js'),
      ]);
      this.scene = new Scene(canvas);
      this.hoverImage = new HoverImage();
      if (this._booted) this.scene.playIntro(); // si el preloader ya terminó
    } catch (e) {
      console.error('WebGL no disponible, sigo con fondo CSS:', e);
      document.body.classList.add('no-gl');
    }
  }

  _bindEvents() {
    // Puntero normalizado -> shader (solo si hay WebGL).
    this._onPointer = (e) => {
      if (this.scene)
        this.scene.setMouse(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', this._onPointer, { passive: true });

    // Progreso de scroll -> shader.
    this.smooth.bindProgress((p) => {
      if (this.scene) this.scene.setScroll(p);
    });

    // Resize con debounce; refrescamos ScrollTrigger tras reflow.
    let rAF;
    this._onResize = () => {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        if (this.scene) this.scene.resize();
        ScrollTrigger.refresh();
      });
    };
    window.addEventListener('resize', this._onResize);

    // Pausa el render cuando la pestaña no está visible (ahorra GPU).
    document.addEventListener('visibilitychange', () => {
      this._visible = !document.hidden;
    });
    this._visible = true;
  }

  _startLoop() {
    // deltaTime de GSAP viene en ms.
    this._tick = (_time, deltaMs) => {
      const dt = deltaMs / 1000;
      if (this._visible && this.scene) this.scene.update();
      this.cursor.update(dt);
      if (this.hoverImage) this.hoverImage.update(dt);
    };
    gsap.ticker.add(this._tick);
  }

  async _boot() {
    // Esperá las fuentes para que el split de texto mida bien.
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }
    this.reveal.initScroll();
    await this.preloader.play();
    this._booted = true;
    // El organismo entra junto con el reveal del hero (solo desktop/WebGL).
    // Si el chunk de WebGL todavía no cargó, _initGL dispara la intro al llegar.
    if (this.scene) this.scene.playIntro();
    this.reveal.intro();
  }

  destroy() {
    gsap.ticker.remove(this._tick);
    window.removeEventListener('pointermove', this._onPointer);
    window.removeEventListener('resize', this._onResize);
    this.smooth.destroy();
    this.cursor.destroy();
    this.marquee.destroy();
    if (this.hoverImage) this.hoverImage.destroy();
    this.sectionTint.destroy();
    this.projectDetail.destroy();
    this.mobileNav.destroy();
    if (this.scene) this.scene.dispose();
  }
}
