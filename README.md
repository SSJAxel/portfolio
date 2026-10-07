# Axel Santiago Chávez — web personal

Sitio personal estilo creative-dev (ref: [edolus.com](https://edolus.com)), en
**tema claro** (fondo "bone" cálido + acento eléctrico). Concepto: **"sistema
vivo" + bitácora** — productos propios con arquitecturas estudiadas, y el proceso
documentado. WebGL, scroll suave, cursor custom, marquee, lista de proyectos con
imagen que sigue el cursor, count-up y **toggle de idioma ES/EN**.

## Stack

- **Vite** — dev server + build (chunks separados para Three y GSAP).
- **Three.js** — capa WebGL (plano fullscreen + ShaderMaterial), color management off.
- **GLSL** — fragment con fbm + domain warping, paleta clara, acento concentrado arriba.
- **GSAP + ScrollTrigger** — intro, reveals, split de texto, count-up, marquee.
- **Lenis** — scroll suave, tickeado por GSAP (un solo loop).

## Correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # sirve el build
```

## Secciones

Hero · Marquee · Sobre mí · Proyectos (hover = imagen flotante: capibooking,
capicotizador, ai-site-auditor) · Qué hago · Números (count-up) · Footer CTA
con LinkedIn/GitHub.

## Arquitectura

```
src/
├─ main.js
├─ core/App.js           # composición + loop único (gsap.ticker)
├─ gl/
│  ├─ Scene.js           # renderer + composer (bloom selectivo), render loop
│  ├─ Background.js      # plano fullscreen + uniforms (paleta + tinte por sección)
│  ├─ HeroObject.js      # organismo 3D procedural (ruido + fresnel + intro)
│  └─ shaders/*.vert|frag
├─ modules/
│  ├─ Smooth.js          # Lenis <-> GSAP <-> ScrollTrigger (+ stop/start)
│  ├─ Cursor.js          # cursor custom con lerp
│  ├─ Preloader.js       # intro de carga (Promise)
│  ├─ Reveal.js          # split de texto + reveals + count-up (+ rebuild para i18n)
│  ├─ Marquee.js         # marquee infinito reactivo al scroll
│  ├─ HoverImage.js      # preview de proyecto distorsionada en WebGL (canvas overlay)
│  ├─ ProjectDetail.js   # panel de detalle deslizante, data-driven y bilingüe
│  ├─ SectionTint.js     # IntersectionObserver -> color de fondo por sección
│  ├─ MobileNav.js       # menú overlay mobile (burger + smooth scroll)
│  ├─ Journal.js         # bitácora data-driven (entradas + traducciones)
│  └─ I18n.js            # traducción ES/EN por [data-i18n], persistida
├─ utils/math.js
└─ styles/main.css
public/img/              # mockups SVG de los proyectos (reemplazar por capturas)
```

## Dónde tocar

- **Textos / idiomas**: `src/modules/I18n.js` (diccionarios `es` / `en`). Cada
  texto traducible lleva `data-i18n="clave"` en el HTML. El `<html lang>` y el
  botón se actualizan solos; el idioma se guarda en `localStorage`.
- **Paleta / mood**: `src/styles/main.css` (`--paper`, `--ink`, `--accent`,
  `--accent-2`) **y** los uniforms `uColorA/B/C` en `gl/Background.js` (mantener
  en sync si cambia el acento).
- **El efecto del fondo**: `gl/shaders/background.frag`.
- **Proyectos (lista)**: `<li class="project" data-img="..." data-project="slug">`
  en `index.html` + su imagen en `public/img/` + la tag en `I18n.js`.
- **Detalle de proyecto**: el objeto `PROJECTS` en `src/modules/ProjectDetail.js`
  (resumen, decisiones, stack, links — todo ES/EN). La `key` debe coincidir con
  el `data-project` del `<li>`.
- **Color de fondo por sección**: atributo `data-tint="#..."` en cada `<section>`.
- **Números**: `data-count` en el HTML (valores editables).
- **Bitácora**: editá el array `ENTRIES` en `src/modules/Journal.js` (fecha,
  categoría, título/extracto ES+EN, URL del post). Se renderiza y traduce solo.

## Siguientes pasos

1. Reemplazar los SVG de `public/img` por capturas reales de cada proyecto.
2. Modelo 3D en el hero: `GLTFLoader` como segundo componente GL.
3. Post-processing: `EffectComposer` + bloom.
4. Una sección/página de **bitácora** enlazada con tu LinkedIn.

## Accesibilidad

Respeta `prefers-reduced-motion`: desactiva inercia de scroll, pone la intensidad
del shader en 0, desactiva marquee/imagen flotante y muestra todo sin animaciones.
